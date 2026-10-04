import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const LIBRARY_FILE = path.join(__dirname, 'library.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Map tracking roomId -> Set of uploaded filenames for EPHEMERAL cleanup
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID || '0050ce468f0de3b0000000001';
const B2_APP_KEY = process.env.B2_APPLICATION_KEY || 'K005n45/Ku1QhgCeG2qBCCzyurjLeu4';
const B2_BUCKET = process.env.B2_BUCKET_NAME || 'coup-lee';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-east-005';
const DEFAULT_ADMIN_EMAIL = 'ceo.shubhampathak@gmail.com';

const isB2Configured = Boolean(B2_KEY_ID && B2_APP_KEY && B2_BUCKET);

let s3Client = null;
if (isB2Configured) {
  s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
      accessKeyId: B2_KEY_ID,
      secretAccessKey: B2_APP_KEY,
    },
  });
  console.log(`[Storage] Backblaze B2 storage initialized (Bucket: ${B2_BUCKET})`);
} else {
  console.log('[Storage] Local storage initialized (B2 credentials optional)');
}

// In-memory Library cache of permanently saved tracks
let libraryTracks = [];

function loadLibraryFromDisk() {
  try {
    if (fs.existsSync(LIBRARY_FILE)) {
      const data = fs.readFileSync(LIBRARY_FILE, 'utf8');
      libraryTracks = JSON.parse(data);
      console.log(`[Storage] Loaded ${libraryTracks.length} permanent tracks from library.json`);
    }
  } catch (err) {
    console.warn('[Storage] Could not load library.json:', err.message);
    libraryTracks = [];
  }
}

async function syncLibraryManifestToB2() {
  if (!isB2Configured || !s3Client) return;
  try {
    const manifestJson = JSON.stringify(libraryTracks, null, 2);
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: 'library/manifest.json',
      Body: manifestJson,
      ContentType: 'application/json',
    });
    await s3Client.send(command);
    console.log('[Storage] Synced library manifest to Backblaze B2');
  } catch (err) {
    console.warn('[Storage] Failed to sync manifest to B2:', err.message);
  }
}

async function restoreLibraryFromB2() {
  if (!isB2Configured || !s3Client) return;
  try {
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: 'library/manifest.json',
    });
    const res = await s3Client.send(command);
    const bodyString = await res.Body.transformToString();
    const parsed = JSON.parse(bodyString);
    if (Array.isArray(parsed) && parsed.length > libraryTracks.length) {
      libraryTracks = parsed;
      fs.writeFileSync(LIBRARY_FILE, JSON.stringify(libraryTracks, null, 2));
      console.log(`[Storage] Restored ${libraryTracks.length} tracks from Backblaze B2 manifest`);
    }
  } catch (err) {
    // Normal if first time
  }
}

// Initial load
loadLibraryFromDisk();
restoreLibraryFromB2();

/**
 * Register a newly uploaded file for a room
 * Rules:
 * 1. If uploaded by ADMIN_EMAIL -> ALWAYS PERMANENT in B2 (Never delete).
 * 2. If uploaded by ANY user and size <= 50MB -> PERMANENT in B2 (Never delete).
 * 3. If other user and > 50MB -> EPHEMERAL (Auto-deleted when room closes).
 */
export async function registerFile(file, roomId, meta = {}) {
  const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const uploaderEmail = (meta.userEmail || '').toLowerCase().trim();

  const isUploaderAdmin = Boolean(adminEmail && uploaderEmail && uploaderEmail === adminEmail);
  const isUnder50MB = file.size <= 50 * 1024 * 1024;
  const isPermanent = isUploaderAdmin || isUnder50MB;

  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const cleanTitle = meta.title || originalName.replace(/\.[^/.]+$/, '');

  if (isPermanent) {
    console.log(`[Storage] Track marked PERMANENT (Admin: ${isUploaderAdmin}, Under 50MB: ${isUnder50MB}): ${file.filename}`);
    // Upload permanently to Backblaze B2
    if (isB2Configured && s3Client) {
      try {
        const fileStream = fs.createReadStream(file.path);
        const command = new PutObjectCommand({
          Bucket: B2_BUCKET,
          Key: `library/${file.filename}`,
          Body: fileStream,
          ContentType: file.mimetype,
        });
        await s3Client.send(command);
        console.log(`[Storage] Permanently saved ${file.filename} to B2 library!`);
      } catch (err) {
        console.error('[Storage] B2 permanent upload error:', err.message);
      }
    }

    // Add to persistent library manifest
    const trackEntry = {
      id: 'b2_' + file.filename,
      filename: file.filename,
      title: cleanTitle,
      artist: meta.artist || 'Uploaded Track',
      url: `/api/stream/${file.filename}`,
      size: file.size,
      duration: Number(meta.duration) || 0,
      uploadedBy: uploaderEmail || meta.userName || 'Partner',
      isAdminTrack: isUploaderAdmin,
      isPermanent: true,
      uploadedAt: Date.now(),
    };

    // Avoid duplicate
    if (!libraryTracks.some((t) => t.filename === file.filename)) {
      libraryTracks.unshift(trackEntry);
      try {
        fs.writeFileSync(LIBRARY_FILE, JSON.stringify(libraryTracks, null, 2));
      } catch (e) {}
      syncLibraryManifestToB2();
    }
  } else {
    // Ephemeral track: track under roomId for auto-cleanup on room exit
    console.log(`[Storage] Track marked EPHEMERAL (>50MB non-admin): ${file.filename}`);
    if (!roomFilesMap.has(roomId)) {
      roomFilesMap.set(roomId, new Set());
    }
    roomFilesMap.get(roomId).add(file.filename);

    if (isB2Configured && s3Client) {
      try {
        const fileStream = fs.createReadStream(file.path);
        const command = new PutObjectCommand({
          Bucket: B2_BUCKET,
          Key: `rooms/${roomId}/${file.filename}`,
          Body: fileStream,
          ContentType: file.mimetype,
        });
        await s3Client.send(command);
      } catch (err) {
        console.error('[Storage] B2 ephemeral upload error:', err.message);
      }
    }
  }

  return {
    filename: file.filename,
    originalName,
    size: file.size,
    mimetype: file.mimetype,
    isPermanent,
    url: `/api/stream/${file.filename}`,
  };
}

/**
 * Return all permanently saved library tracks
 */
export function getLibraryTracks() {
  return libraryTracks;
}

/**
 * Cleanup ephemeral files when room disbands.
 * PERMANENT B2 files are NEVER deleted!
 */
export async function cleanupRoomFiles(roomId) {
  if (!roomFilesMap.has(roomId)) return;

  const filenames = roomFilesMap.get(roomId);
  console.log(`[Storage] Purging ${filenames.size} ephemeral files for room ${roomId}...`);

  for (const filename of filenames) {
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Storage] Auto-purged ephemeral file: ${filename}`);
      } catch (err) {
        console.error(`[Storage] Error auto-purging ${filename}:`, err.message);
      }
    }

    if (isB2Configured && s3Client) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: B2_BUCKET,
          Key: `rooms/${roomId}/${filename}`,
        }));
      } catch (err) {
        console.error(`[Storage] B2 cleanup error for ${filename}:`, err.message);
      }
    }
  }

  roomFilesMap.delete(roomId);
}

export { UPLOADS_DIR, isB2Configured, s3Client };
