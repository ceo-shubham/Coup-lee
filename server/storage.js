import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Map tracking roomId -> Set of uploaded filenames for ephemeral cleanup
const roomFilesMap = new Map();

// Optional Backblaze B2 client configuration
const isB2Configured = Boolean(
  process.env.B2_APPLICATION_KEY_ID &&
  process.env.B2_APPLICATION_KEY &&
  process.env.B2_BUCKET_NAME
);

let s3Client = null;
if (isB2Configured) {
  s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
    region: process.env.B2_REGION || 'us-east-005',
    credentials: {
      accessKeyId: process.env.B2_APPLICATION_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
  });
  console.log('[Storage] Backblaze B2 storage initialized');
} else {
  console.log('[Storage] Local ephemeral storage initialized (auto-cleanup on room exit)');
}

/**
 * Register a newly uploaded file for a room
 */
export async function registerFile(file, roomId) {
  if (!roomFilesMap.has(roomId)) {
    roomFilesMap.set(roomId, new Set());
  }
  roomFilesMap.get(roomId).add(file.filename);

  // If B2 is enabled, also upload to B2
  if (isB2Configured && s3Client) {
    try {
      const fileStream = fs.createReadStream(file.path);
      const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: `rooms/${roomId}/${file.filename}`,
        Body: fileStream,
        ContentType: file.mimetype,
      });
      await s3Client.send(command);
      console.log(`[Storage] Uploaded ${file.filename} to Backblaze B2 for room ${roomId}`);
    } catch (err) {
      console.error('[Storage] B2 upload error:', err.message);
    }
  }

  return {
    filename: file.filename,
    originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    size: file.size,
    mimetype: file.mimetype,
    url: `/api/stream/${file.filename}`,
  };
}

/**
 * Delete a specific file from disk (and B2 if configured)
 */
export async function deleteFile(filename, roomId) {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`[Storage] Deleted ephemeral file: ${filename}`);
    } catch (e) {
      console.error(`[Storage] Failed to delete file ${filename}:`, e.message);
    }
  }

  if (roomId && roomFilesMap.has(roomId)) {
    roomFilesMap.get(roomId).delete(filename);
  }

  if (isB2Configured && s3Client && roomId) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: `rooms/${roomId}/${filename}`,
      }));
    } catch (err) {
      console.error('[Storage] B2 delete error:', err.message);
    }
  }
}

/**
 * Completely delete all files belonging to a room when it closes or users exit
 */
export async function cleanupRoomFiles(roomId) {
  if (!roomFilesMap.has(roomId)) return;

  const filenames = roomFilesMap.get(roomId);
  console.log(`[Storage] Cleaning up ${filenames.size} files for room ${roomId}...`);

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
          Bucket: process.env.B2_BUCKET_NAME,
          Key: `rooms/${roomId}/${filename}`,
        }));
      } catch (err) {
        console.error(`[Storage] B2 cleanup error for ${filename}:`, err.message);
      }
    }
  }

  roomFilesMap.delete(roomId);
}

export { UPLOADS_DIR };
