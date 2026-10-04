import { cleanupRoomFiles } from './storage.js';

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room object
    this.userToRoom = new Map(); // socketId -> roomId
    this.cleanupTimeouts = new Map(); // roomId -> timeoutId
  }

  /**
   * Generate a random 6-digit numeric room code
   */
  generateNumericCode() {
    let code;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Create a new room with a 6-digit numeric code
   */
  createRoom(user, socketId) {
    const roomId = this.generateNumericCode();
    const room = {
      id: roomId,
      createdAt: Date.now(),
      creatorSocketId: socketId,
      users: new Map(),
      currentTrack: null,
      playback: {
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1,
      },
      queue: [],
      history: [],
      messages: [],
      togetherTimerStart: null,
    };

    room.users.set(socketId, {
      socketId,
      user: {
        id: user.id || socketId,
        name: user.name || 'Anonymous',
        email: user.email || '',
        avatar: user.avatar || '',
      },
      joinedAt: Date.now(),
      isCreator: true,
    });

    this.rooms.set(roomId, room);
    this.userToRoom.set(socketId, roomId);

    console.log(`[RoomManager] Room created: ${roomId} by ${user.name || 'User'} (${socketId})`);
    return this.serializeRoom(room);
  }

  /**
   * Join an existing room with 6-digit numeric code
   */
  joinRoom(roomId, user, socketId) {
    // Cancel any pending cleanup for this room if someone is rejoining
    if (this.cleanupTimeouts.has(roomId)) {
      clearTimeout(this.cleanupTimeouts.get(roomId));
      this.cleanupTimeouts.delete(roomId);
      console.log(`[RoomManager] Cancelled pending cleanup for room ${roomId} (user joined)`);
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { error: 'Room not found. Please check the 6-digit code.' };
    }

    // Check if user is reconnecting with a new socketId (replace old socket entry)
    let isCreator = false;
    for (const [oldSocketId, existingEntry] of room.users.entries()) {
      if (
        (user.id && existingEntry.user?.id === user.id) ||
        (user.email && existingEntry.user?.email === user.email) ||
        (user.name && existingEntry.user?.name === user.name)
      ) {
        isCreator = existingEntry.isCreator;
        room.users.delete(oldSocketId);
        this.userToRoom.delete(oldSocketId);
        console.log(`[RoomManager] Seamlessly reconnected user ${user.name} (old socket: ${oldSocketId} -> new: ${socketId})`);
        break;
      }
    }

    // Maximum 5 people (ideal for couple 2-3 people)
    if (room.users.size >= 5) {
      return { error: 'Room is full (maximum capacity reached).' };
    }

    room.users.set(socketId, {
      socketId,
      user: {
        id: user.id || socketId,
        name: user.name || 'Love Partner',
        email: user.email || '',
        avatar: user.avatar || '',
      },
      joinedAt: Date.now(),
      isCreator,
    });

    this.userToRoom.set(socketId, roomId);

    // Start together timer when 2nd person joins
    if (room.users.size >= 2 && !room.togetherTimerStart) {
      room.togetherTimerStart = Date.now();
    }

    console.log(`[RoomManager] User ${user.name} joined room ${roomId}. Total users: ${room.users.size}`);
    return { room: this.serializeRoom(room) };
  }

  /**
   * Handle user disconnect / leave
   */
  leaveRoom(socketId) {
    const roomId = this.userToRoom.get(socketId);
    if (!roomId) return null;

    this.userToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const departingUser = room.users.get(socketId);
    room.users.delete(socketId);

    console.log(`[RoomManager] User left room ${roomId}. Remaining: ${room.users.size}`);

    // If room is completely empty, schedule 2-minute grace period before purging
    if (room.users.size === 0) {
      console.log(`[RoomManager] Room ${roomId} is empty. Scheduling file & room deletion (2 min grace period).`);
      const timeoutId = setTimeout(async () => {
        await cleanupRoomFiles(roomId);
        this.rooms.delete(roomId);
        this.cleanupTimeouts.delete(roomId);
        console.log(`[RoomManager] Room ${roomId} and all its uploaded files completely purged.`);
      }, 120000); // 2 minute grace period for mobile app minimize / lock screen

      this.cleanupTimeouts.set(roomId, timeoutId);
    }

    return {
      roomId,
      departingUser,
      room: this.serializeRoom(room),
    };
  }

  /**
   * Explicitly destroy a room and immediately delete all its files (e.g., when host logs out)
   */
  async destroyRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [sockId] of room.users) {
      this.userToRoom.delete(sockId);
    }

    await cleanupRoomFiles(roomId);
    this.rooms.delete(roomId);
    console.log(`[RoomManager] Force destroyed room ${roomId} and cleaned up files.`);
  }

  /**
   * Update playback status (play, pause, seek)
   */
  updatePlayback(roomId, { isPlaying, currentTime, playbackRate }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.playback = {
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : room.playback.isPlaying,
      currentTime: typeof currentTime === 'number' ? currentTime : room.playback.currentTime,
      lastUpdated: Date.now(),
      playbackRate: playbackRate || room.playback.playbackRate || 1,
    };

    return room.playback;
  }

  /**
   * Set new current playing track
   */
  setCurrentTrack(roomId, track) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.currentTrack) {
      room.history.unshift(room.currentTrack);
      if (room.history.length > 20) room.history.pop();
    }

    room.currentTrack = track;
    room.playback = {
      isPlaying: true,
      currentTime: 0,
      lastUpdated: Date.now(),
      playbackRate: 1,
    };

    return {
      currentTrack: room.currentTrack,
      playback: room.playback,
      history: room.history,
    };
  }

  /**
   * Add track to shared queue
   */
  addToQueue(roomId, track) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // If nothing currently playing, play this immediately
    if (!room.currentTrack) {
      return this.setCurrentTrack(roomId, track);
    }

    room.queue.push(track);
    return { queue: room.queue };
  }

  /**
   * Play next track from queue
   */
  playNext(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.queue.length > 0) {
      const nextTrack = room.queue.shift();
      return this.setCurrentTrack(roomId, nextTrack);
    } else {
      room.currentTrack = null;
      room.playback.isPlaying = false;
      return { currentTrack: null, playback: room.playback, queue: [] };
    }
  }

  /**
   * Remove track from queue
   */
  removeFromQueue(roomId, trackId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.queue = room.queue.filter((t) => t.id !== trackId);
    return room.queue;
  }

  /**
   * Add a chat/whisper message
   */
  addMessage(roomId, { text, sender, type = 'text', emoji = null }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const message = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      text,
      sender,
      type,
      emoji,
      timestamp: Date.now(),
    };

    room.messages.push(message);
    if (room.messages.length > 100) room.messages.shift();

    return message;
  }

  /**
   * Helper to format room data for client
   */
  serializeRoom(room) {
    if (!room) return null;
    return {
      id: room.id,
      createdAt: room.createdAt,
      users: Array.from(room.users.values()),
      currentTrack: room.currentTrack,
      playback: room.playback,
      queue: room.queue,
      history: room.history,
      messages: room.messages,
      togetherTimerStart: room.togetherTimerStart,
    };
  }
}

export const roomManager = new RoomManager();
