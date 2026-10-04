import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function useSocket() {
  const socketRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const currentUserRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL || undefined, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected with ID:', socket.id);

      // Seamlessly rejoin room if we were already in one before mobile minimize/network switch
      if (activeRoomIdRef.current && currentUserRef.current) {
        console.log('[Socket] Reconnected! Silently rejoining room:', activeRoomIdRef.current);
        socket.emit('room:join', {
          roomId: activeRoomIdRef.current,
          user: currentUserRef.current,
        }, (response) => {
          if (response?.room) {
            setRoom(response.room);
            setMessages(response.room.messages || []);
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected (grace period active)');
    });

    socket.on('room:user_joined', ({ user, room: updatedRoom }) => {
      setRoom(updatedRoom);
      // Auto system message
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys_' + Date.now(),
          text: `✨ ${user?.user?.name || 'Your partner'} connected with love ❤️`,
          type: 'system',
          timestamp: Date.now(),
        },
      ]);
    });

    socket.on('room:user_left', ({ user, room: updatedRoom }) => {
      setRoom(updatedRoom);
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys_' + Date.now(),
          text: `💔 ${user?.user?.name || 'Partner'} disconnected`,
          type: 'system',
          timestamp: Date.now(),
        },
      ]);
    });

    socket.on('playback:sync', ({ playback, senderId }) => {
      setRoom((prev) => (prev ? { ...prev, playback } : null));
      setLastSyncEvent({ playback, senderId, timestamp: Date.now() });
    });

    socket.on('track:changed', ({ currentTrack, playback, history, queue }) => {
      setRoom((prev) => (prev ? {
        ...prev,
        currentTrack,
        playback: playback || prev.playback,
        history: history || prev.history,
        queue: queue !== undefined ? queue : prev.queue,
      } : null));
    });

    socket.on('queue:updated', ({ queue }) => {
      setRoom((prev) => (prev ? { ...prev, queue } : null));
    });

    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('reaction:received', (reaction) => {
      setReactions((prev) => [...prev.slice(-15), reaction]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Actions
  const createRoom = useCallback((user) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not initialized'));

      const timeoutId = setTimeout(() => {
        reject(new Error('Server took too long to connect. Please check server status or retry in a few seconds.'));
      }, 7000);

      currentUserRef.current = user;

      socketRef.current.emit('room:create', { user }, (response) => {
        clearTimeout(timeoutId);
        if (response?.error) {
          reject(new Error(response.error));
        } else if (response?.room) {
          activeRoomIdRef.current = response.room.id;
          setRoom(response.room);
          setMessages(response.room.messages || []);
          resolve(response.room);
        } else {
          reject(new Error('Failed to create room'));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomId, user) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not initialized'));

      const timeoutId = setTimeout(() => {
        reject(new Error('Server took too long to connect. Please retry in a few seconds.'));
      }, 7000);

      currentUserRef.current = user;

      socketRef.current.emit('room:join', { roomId, user }, (response) => {
        clearTimeout(timeoutId);
        if (response?.error) {
          reject(new Error(response.error));
        } else if (response?.room) {
          activeRoomIdRef.current = response.room.id;
          setRoom(response.room);
          setMessages(response.room.messages || []);
          resolve(response.room);
        } else {
          reject(new Error('Failed to join room'));
        }
      });
    });
  }, []);

  const leaveRoom = useCallback((roomId) => {
    return new Promise((resolve) => {
      activeRoomIdRef.current = null;
      currentUserRef.current = null;
      if (socketRef.current) {
        socketRef.current.emit('room:leave', { roomId }, () => {
          setRoom(null);
          setMessages([]);
          setReactions([]);
          resolve();
        });
      } else {
        setRoom(null);
        resolve();
      }
    });
  }, []);

  const sendPlaybackUpdate = useCallback((isPlaying, currentTime, playbackRate = 1) => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('playback:update', {
      roomId: room.id,
      isPlaying,
      currentTime,
      playbackRate,
    });
    // Optimistically update local room
    setRoom((prev) => prev ? {
      ...prev,
      playback: {
        ...prev.playback,
        isPlaying,
        currentTime,
        lastUpdated: Date.now(),
      }
    } : null);
  }, [room?.id]);

  const changeTrack = useCallback((track) => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('track:change', { roomId: room.id, track });
  }, [room?.id]);

  const addToQueue = useCallback((track) => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('queue:add', { roomId: room.id, track });
  }, [room?.id]);

  const playNext = useCallback(() => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('queue:next', { roomId: room.id });
  }, [room?.id]);

  const removeFromQueue = useCallback((trackId) => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('queue:remove', { roomId: room.id, trackId });
  }, [room?.id]);

  const sendMessage = useCallback((text, type = 'text', emoji = null, sender) => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('chat:send', {
      roomId: room.id,
      text,
      type,
      emoji,
      sender,
    });
  }, [room?.id]);

  const sendReaction = useCallback((reaction, sender) => {
    if (!socketRef.current || !room?.id) return;
    socketRef.current.emit('reaction:send', {
      roomId: room.id,
      reaction,
      sender,
    });
  }, [room?.id]);

  return {
    socket: socketRef.current,
    isConnected,
    room,
    messages,
    reactions,
    lastSyncEvent,
    createRoom,
    joinRoom,
    leaveRoom,
    sendPlaybackUpdate,
    changeTrack,
    addToQueue,
    playNext,
    removeFromQueue,
    sendMessage,
    sendReaction,
  };
}
