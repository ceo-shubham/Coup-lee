import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { roomManager } from './roomManager.js';
import { registerFile, getLibraryTracks, UPLOADS_DIR, isB2Configured, s3Client } from './storage.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const rawOrigins = process.env.CLIENT_ORIGIN || '*';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

const defaultOrigins = [
  'https://coup-lee.zenstro.space',
  'https://coup-le.ceoshubham.workers.dev',
  'http://localhost:5173',
  'http://localhost:4000',
];

// CORS origin resolver that respects credentials: true with wildcard support
const corsOriginHandler = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, curl, or same-origin)
  if (
    !origin ||
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(origin) ||
    defaultOrigins.includes(origin) ||
    origin.endsWith('.zenstro.space') ||
    origin.endsWith('.workers.dev')
  ) {
    return callback(null, true);
  }
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 2e8, // 200MB max payload
});

app.use(cors({ origin: corsOriginHandler, credentials: true }));
app.use(express.json());

// Configure Multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit per audio file
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/aac',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a',
      'audio/ogg',
      'audio/flac',
      'audio/webm',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, AAC, M4A, OGG, FLAC) are supported'));
    }
  },
});

// Audio upload endpoint
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const roomId = req.body.roomId;
    if (!roomId) {
      // Clean up orphaned uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing roomId' });
    }

    const fileMeta = await registerFile(req.file, roomId, {
      userEmail: req.body.userEmail || req.body.email || '',
      title: req.body.title,
      artist: req.body.artist,
      duration: req.body.duration,
      userName: req.body.userName,
    });

    const track = {
      id: 'audio_' + req.file.filename,
      type: 'audio',
      title: req.body.title || fileMeta.originalName.replace(/\.[^/.]+$/, ''),
      artist: req.body.artist || 'Uploaded Audio',
      url: `/api/stream/${req.file.filename}`,
      originalFilename: fileMeta.originalName,
      size: fileMeta.size,
      duration: Number(req.body.duration) || 0,
      thumbnail: null,
      isPermanent: fileMeta.isPermanent,
      addedBy: {
        name: req.body.userName || 'Partner',
        avatar: req.body.userAvatar || '',
      },
    };

    res.json({ success: true, track });
  } catch (error) {
    console.error('[Server] Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload audio file' });
  }
});

// Persistent Audio Library Endpoint (tracks saved permanently in B2)
app.get('/api/library', (req, res) => {
  try {
    const tracks = getLibraryTracks();
    res.json({ success: true, tracks });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch library' });
  }
});

// Audio streaming with HTTP 206 Partial Content (essential for audio seeking & lockscreen buffering)
app.get('/api/stream/:filename', async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    // If not on local disk (e.g. Render container restarted), stream from Backblaze B2!
    if (isB2Configured && s3Client) {
      try {
        const b2Command = new GetObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME,
          Key: `library/${filename}`,
          Range: req.headers.range,
        });
        const b2Res = await s3Client.send(b2Command);
        if (req.headers.range && b2Res.ContentRange) {
          res.writeHead(206, {
            'Content-Range': b2Res.ContentRange,
            'Accept-Ranges': 'bytes',
            'Content-Length': b2Res.ContentLength,
            'Content-Type': b2Res.ContentType || 'audio/mpeg',
          });
        } else {
          res.writeHead(200, {
            'Content-Length': b2Res.ContentLength,
            'Content-Type': b2Res.ContentType || 'audio/mpeg',
            'Accept-Ranges': 'bytes',
          });
        }
        return b2Res.Body.pipe(res);
      } catch (err) {
        console.warn(`[Storage] B2 streaming fallback failed for ${filename}:`, err.message);
      }
    }
    return res.status(404).json({ error: 'Audio file not found or expired' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsActive: roomManager.rooms.size,
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static build in production (Unified deployment support)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Fallback to index.html for client-side routing on any non-API request
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Track pending disconnect timeouts for mobile grace periods
const disconnectGraceTimers = new Map();

// Socket.io Real-time Event Handling
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Create room
  socket.on('room:create', ({ user }, callback) => {
    try {
      const room = roomManager.createRoom(user || {}, socket.id);
      socket.join(room.id);
      if (typeof callback === 'function') callback({ success: true, room });
      console.log(`[Socket] Created room ${room.id} by ${user?.name}`);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: e.message });
    }
  });

  // Join room
  socket.on('room:join', ({ roomId, user }, callback) => {
    try {
      const result = roomManager.joinRoom(roomId, user || {}, socket.id);
      if (result.error) {
        if (typeof callback === 'function') callback({ error: result.error });
        return;
      }

      socket.join(roomId);

      // Notify caller
      if (typeof callback === 'function') callback({ success: true, room: result.room });

      // Notify others in room
      socket.to(roomId).emit('room:user_joined', {
        user: result.room.users.find((u) => u.socketId === socket.id),
        room: result.room,
      });

      console.log(`[Socket] User ${user?.name} joined room ${roomId}`);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: e.message });
    }
  });

  // Explicit Leave room
  socket.on('room:leave', ({ roomId }, callback) => {
    if (disconnectGraceTimers.has(socket.id)) {
      clearTimeout(disconnectGraceTimers.get(socket.id));
      disconnectGraceTimers.delete(socket.id);
    }
    const result = roomManager.leaveRoom(socket.id);
    if (result) {
      socket.leave(result.roomId);
      socket.to(result.roomId).emit('room:user_left', {
        user: result.departingUser,
        room: result.room,
      });
    }
    if (typeof callback === 'function') callback({ success: true });
  });

  // Playback state update (play, pause, seek)
  socket.on('playback:update', ({ roomId, isPlaying, currentTime, playbackRate }) => {
    const updated = roomManager.updatePlayback(roomId, { isPlaying, currentTime, playbackRate });
    if (updated) {
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('playback:sync', {
        playback: updated,
        senderId: socket.id,
      });
    }
  });

  // Track change (immediate play)
  socket.on('track:change', ({ roomId, track }) => {
    const result = roomManager.setCurrentTrack(roomId, track);
    if (result) {
      io.in(roomId).emit('track:changed', result);
    }
  });

  // Add track to queue
  socket.on('queue:add', ({ roomId, track }) => {
    const result = roomManager.addToQueue(roomId, track);
    if (result) {
      if (result.currentTrack) {
        io.in(roomId).emit('track:changed', result);
      } else {
        io.in(roomId).emit('queue:updated', result);
      }
    }
  });

  // Skip / Next track
  socket.on('queue:next', ({ roomId }) => {
    const result = roomManager.playNext(roomId);
    if (result) {
      io.in(roomId).emit('track:changed', result);
    }
  });

  // Remove track from queue
  socket.on('queue:remove', ({ roomId, trackId }) => {
    const queue = roomManager.removeFromQueue(roomId, trackId);
    if (queue) {
      io.in(roomId).emit('queue:updated', { queue });
    }
  });

  // Real-time Chat / Whisper / Love Note
  socket.on('chat:send', ({ roomId, text, sender, emoji, type }) => {
    const message = roomManager.addMessage(roomId, { text, sender, emoji, type });
    if (message) {
      io.in(roomId).emit('chat:message', message);
    }
  });

  // Floating Heart / Live Love Reaction Burst
  socket.on('reaction:send', ({ roomId, reaction, sender }) => {
    io.in(roomId).emit('reaction:received', {
      reaction: reaction || '❤️',
      sender,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    });
  });

  // Sync ping (to calculate client-server time offset for precision sync)
  socket.on('sync:ping', (clientTimestamp, callback) => {
    if (typeof callback === 'function') {
      callback({
        clientTimestamp,
        serverTimestamp: Date.now(),
      });
    }
  });

  // Disconnect with grace period for mobile app switching / lock screen
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason}). Starting 45s grace period.`);
    const currentSocketId = socket.id;
    const roomId = roomManager.userToRoom.get(currentSocketId);

    if (roomId) {
      const graceTimer = setTimeout(() => {
        disconnectGraceTimers.delete(currentSocketId);
        const result = roomManager.leaveRoom(currentSocketId);
        if (result) {
          socket.to(result.roomId).emit('room:user_left', {
            user: result.departingUser,
            room: result.room,
          });
        }
      }, 45000);
      disconnectGraceTimers.set(currentSocketId, graceTimer);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n❤️ Coup-le server is running on http://localhost:${PORT}`);
  console.log(`🎵 Ready for real-time couple audio & video sync!\n`);
});
