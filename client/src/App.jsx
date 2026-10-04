import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './hooks/useSocket';
import { useWakeLock } from './hooks/useWakeLock';
import { useMediaSession } from './hooks/useMediaSession';

import { AuthScreen } from './components/AuthScreen';
import { RoomJoinCreate } from './components/RoomJoinCreate';
import { RoomHeader } from './components/RoomHeader';
import { VinylPlayer } from './components/VinylPlayer';
import { YouTubeSyncPlayer } from './components/YouTubeSyncPlayer';
import { AudioSyncPlayer } from './components/AudioSyncPlayer';
import { MediaControls } from './components/MediaControls';
import { AddMediaModal } from './components/AddMediaModal';
import { PlaylistQueue } from './components/PlaylistQueue';
import { LoveChat } from './components/LoveChat';
import { FloatingHearts } from './components/FloatingHearts';

export function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const {
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
  } = useSocket(user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Player UI states
  const [showVideo, setShowVideo] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Local audio states
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  const currentTrack = room?.currentTrack || null;
  const isPlaying = Boolean(room?.playback?.isPlaying);

  // Screen Wake Lock & Background Audio Keep-Alive
  const { isLocked: isWakeLocked } = useWakeLock(isPlaying && Boolean(room));

  // Lockscreen & Background MediaSession
  useMediaSession({
    currentTrack,
    isPlaying,
    onPlay: () => sendPlaybackUpdate(true, localCurrentTime),
    onPause: () => sendPlaybackUpdate(false, localCurrentTime),
    onNext: () => playNext(),
    onSeek: (time) => sendPlaybackUpdate(isPlaying, time),
  });

  // Track unread chat messages when chat drawer is closed
  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      setUnreadMessages((prev) => prev + 1);
    }
  }, [messages.length, isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadMessages(0);
  };

  // Create Room Handler
  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      await createRoom(user);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  // Join Room Handler
  const handleJoinRoom = async (code) => {
    setLoading(true);
    setError('');
    try {
      await joinRoom(code, user);
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Leave Room Handler
  const handleLeaveRoom = async () => {
    localStorage.removeItem('coup_le_current_room');
    if (room?.id) {
      await leaveRoom(room.id);
    }
  };

  // Synchronized Playback Handlers
  const handlePlaybackChange = useCallback((playing, time) => {
    setLocalCurrentTime(time);
    sendPlaybackUpdate(playing, time);
  }, [sendPlaybackUpdate]);

  const handleSeek = useCallback((seekTime) => {
    setLocalCurrentTime(seekTime);
    sendPlaybackUpdate(isPlaying, seekTime);
  }, [isPlaying, sendPlaybackUpdate]);

  const handleTogglePlay = useCallback(() => {
    const nextPlaying = !isPlaying;
    sendPlaybackUpdate(nextPlaying, localCurrentTime);
  }, [isPlaying, localCurrentTime, sendPlaybackUpdate]);

  const handleTrackEnded = useCallback(() => {
    playNext();
  }, [playNext]);

  const handleTimeUpdate = useCallback((time, dur) => {
    setLocalCurrentTime(time);
    if (dur && dur > 0) {
      setLocalDuration(dur);
    }
  }, []);

  const handleAddTrack = useCallback((track, playImmediately) => {
    if (track?.type === 'youtube') {
      setShowVideo(true);
    }
    if (playImmediately) {
      changeTrack(track);
    } else {
      addToQueue(track);
    }
  }, [changeTrack, addToQueue]);

  const handleSendHeart = useCallback(() => {
    sendReaction('❤️', user);
  }, [sendReaction, user]);

  // Persist active room ID in localStorage
  useEffect(() => {
    if (room?.id) {
      localStorage.setItem('coup_le_current_room', room.id);
    }
  }, [room?.id]);

  // Auto-restore room on page refresh if user was previously in a room
  useEffect(() => {
    if (isAuthenticated && !room && !loading) {
      const savedRoomId = localStorage.getItem('coup_le_current_room');
      const urlParams = new URLSearchParams(window.location.search);
      const targetRoom = urlParams.get('room') || savedRoomId;
      if (targetRoom && /^\d{6}$/.test(targetRoom)) {
        console.log('[App] Auto-restoring room on refresh:', targetRoom);
        handleJoinRoom(targetRoom);
      }
    }
  }, [isAuthenticated, Boolean(room)]);

  // 1. If not authenticated, render Login screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // 2. If authenticated but not in a room, render Room Join/Create
  if (!room) {
    return (
      <RoomJoinCreate
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        loading={loading}
        error={error}
        clearError={() => setError('')}
      />
    );
  }

  // 3. In-Room Main Experience
  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Floating Hearts & Confetti FX */}
      <FloatingHearts reactions={reactions} />

      {/* Top Header */}
      <RoomHeader
        room={room}
        currentUser={user}
        onLeaveRoom={handleLeaveRoom}
        isWakeLocked={isWakeLocked}
      />

      {/* Main Player Display Area (One-Frame Responsive Fit) */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-1 sm:py-2 max-w-4xl mx-auto w-full overflow-hidden">
        {currentTrack?.type === 'youtube' && showVideo ? (
          <div className="w-full flex flex-col items-center gap-2 sm:gap-3 max-h-full">
            <YouTubeSyncPlayer
              track={currentTrack}
              playback={room.playback}
              lastSyncEvent={lastSyncEvent}
              onPlaybackChange={handlePlaybackChange}
              onTrackEnded={handleTrackEnded}
              onTimeUpdate={handleTimeUpdate}
              volume={volume}
              isMuted={isMuted}
            />

            <div className="flex items-center justify-between w-full px-2 max-w-sm sm:max-w-md">
              <div className="min-w-0 mr-2">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs">
                  {currentTrack.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-rose-300/80 truncate">
                  {currentTrack.artist} • Added by {currentTrack.addedBy?.name || 'Partner'}
                </p>
              </div>

              <button
                onClick={() => setShowVideo(false)}
                className="px-2.5 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-[10px] sm:text-xs text-rose-200 transition-colors flex-shrink-0"
              >
                🎵 Switch to CD
              </button>
            </div>
          </div>
        ) : (
          <>
            <VinylPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              onSendHeart={handleSendHeart}
              showVideo={showVideo}
              onToggleVideo={() => setShowVideo(!showVideo)}
            />

            {/* If YouTube track is active but in CD view, keep player mounted offscreen so audio plays smoothly */}
            {currentTrack?.type === 'youtube' && !showVideo && (
              <div
                style={{
                  position: 'fixed',
                  top: '-9999px',
                  left: '-9999px',
                  width: '200px',
                  height: '200px',
                  opacity: 0,
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
                aria-hidden="true"
              >
                <YouTubeSyncPlayer
                  track={currentTrack}
                  playback={room.playback}
                  lastSyncEvent={lastSyncEvent}
                  onPlaybackChange={handlePlaybackChange}
                  onTrackEnded={handleTrackEnded}
                  onTimeUpdate={handleTimeUpdate}
                  volume={volume}
                  isMuted={isMuted}
                />
              </div>
            )}
          </>
        )}

        {/* Hidden Audio Sync Engine for uploaded songs */}
        {currentTrack?.type === 'audio' && (
          <AudioSyncPlayer
            track={currentTrack}
            playback={room.playback}
            lastSyncEvent={lastSyncEvent}
            onPlaybackChange={handlePlaybackChange}
            onTrackEnded={handleTrackEnded}
            onTimeUpdate={handleTimeUpdate}
            volume={volume}
            isMuted={isMuted}
          />
        )}
      </main>

      {/* Media Controls Bar */}
      <footer className="w-full flex-shrink-0 z-40">
        <MediaControls
          isPlaying={isPlaying}
          currentTime={localCurrentTime}
          duration={localDuration || currentTrack?.duration || 0}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onNextTrack={() => playNext()}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
          onToggleChat={handleOpenChat}
          unreadCount={unreadMessages}
          onSendHeart={handleSendHeart}
          hasTrack={Boolean(currentTrack)}
        />
      </footer>

      {/* Add Media Modal (YouTube & Audio Upload) */}
      <AddMediaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTrack={handleAddTrack}
        roomId={room.id}
        currentUser={user}
      />

      {/* Playlist & History Drawer */}
      <PlaylistQueue
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={room.queue || []}
        history={room.history || []}
        currentTrack={currentTrack}
        onPlayTrack={(track) => changeTrack(track)}
        onRemoveTrack={(trackId) => removeFromQueue(trackId)}
      />

      {/* Love Chat / Whispers Drawer */}
      <LoveChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        onSendReaction={sendReaction}
        currentUser={user}
      />
    </div>
  );
}

export default App;
