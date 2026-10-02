# Coup-le ❤️ (Watch & Listen Together in Sync)

A romantic real-time synchronized music & video listening web application designed for couples (and close friends, 2-3 people).

---

## 🌟 Key Features

1. **6-Digit Numeric Room Codes (Create & Join)**:
   - Create a private room and get a simple 6-digit numeric code (e.g. `849201`) or shareable invite link.
   - Partners can join instantly by typing the 6 digits or clicking the link.

2. **Google Account Authentication (Clerk)**:
   - Login via Google Account powered by **Clerk** (`@clerk/clerk-react`).
   - Profile name, photo, and details are automatically shared inside the sync room.
   - Built-in graceful development fallback mode for testing without requiring immediate API keys.

3. **Synchronized YouTube Media Player**:
   - Paste any YouTube link (Videos, Shorts, YouTube Music).
   - Real-time Play, Pause, Seek, and Skip synchronization across all devices.
   - Official YouTube Player with embedded login support: If you have YouTube Premium on your Google account, playback is ad-free!

4. **Direct Audio Upload with Ephemeral Auto-Cleanup**:
   - Upload audio songs directly (MP3, WAV, AAC, M4A, OGG, FLAC) of any size.
   - Instant synchronized streaming with HTTP 206 Partial Content support.
   - **Privacy & Storage Auto-Purge**: All uploaded audio files are automatically purged from the server as soon as the session ends or when users close the tab/log out.
   - Ready for Backblaze B2 S3-compatible cloud storage if configured in `server/.env`.

5. **Screen WakeLock & Background Playback Persistence**:
   - Utilizes the Web Screen Wake Lock API (`navigator.wakeLock`) so mobile phones and laptops don't abruptly sleep or dim during romantic watch sessions.
   - Integrated with the **MediaSession API** (`navigator.mediaSession`) so you can control playback (play, pause, next track) directly from lockscreens and notification bars.

6. **Romantic Aesthetic & Real-Time Love Features**:
   - Soft blush-pink, rose-gold, and midnight glassmorphism UI.
   - Spinning Vinyl record player with animated soundwave visualizer.
   - Real-time **"Tap to Send Heart"** particle bursts floating on your partner's screen.
   - Live **"Together in Love"** duration clock.
   - Synchronized shared queue and whispers/love notes drawer.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run Both Server & Client Concurrently
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:4000`

---

## ⚙️ Configuration (Optional)

### Clerk Google SSO Setup
Create a `.env` file in the `client/` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Backblaze B2 Storage Setup (Optional)
Create a `.env` file in the `server/` directory:
```env
B2_APPLICATION_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_app_key
B2_BUCKET_NAME=your_bucket
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
```
*(If omitted, local ephemeral storage with automatic cleanup on room disband is used by default).*

---

## 🌐 Production Deployment Guide

Coup-le requires a persistent Node.js server (like [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), or a VPS) because it relies on active WebSocket (Socket.IO) connections and audio streaming.

### Option 1: Unified Single-Service Deployment (Recommended)
You can deploy both frontend and backend together on a single Node service:

1. **Build Command**:
   ```bash
   npm run install:all && npm run build
   ```
2. **Start Command**:
   ```bash
   npm start
   ```
3. The server automatically serves the built client SPA from `client/dist` and handles all WebSocket and API requests on the same port with zero CORS configuration needed!

### Option 2: Split Deployment (Vercel Frontend + Render Backend)
- **Backend (Render / Railway)**:
  - Root directory: `server`
  - Build command: `npm install`
  - Start command: `npm start`
  - Set Environment Variables:
    - `CLIENT_ORIGIN`: `https://your-frontend-domain.vercel.app`
- **Frontend (Vercel / Netlify)**:
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set Environment Variables:
    - `VITE_SERVER_URL`: `https://your-backend-domain.onrender.com`
    - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_live_...` (or test key)
