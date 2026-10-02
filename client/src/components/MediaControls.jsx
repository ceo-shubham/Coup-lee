import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Plus,
  ListMusic,
  MessageCircleHeart,
  Heart,
  Sparkles,
} from 'lucide-react';
import { formatTime } from '../utils/youtubeParser';

export function MediaControls({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onNextTrack,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  onOpenAddModal,
  onToggleQueue,
  onToggleChat,
  unreadCount,
  onSendHeart,
  hasTrack,
}) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  const currentDisplayTime = isSeeking ? seekVal : currentTime;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

  const handleSeekChange = (e) => {
    setSeekVal(Number(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
    setSeekVal(currentTime);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
    onSeek(seekVal);
  };

  return (
    <div className="w-full glass-panel-glow border-t border-rose-500/30 p-4 sm:p-5 rounded-t-3xl max-w-5xl mx-auto">
      {/* Progress Scrubber */}
      <div className="w-full flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-rose-300/80 w-10 text-right">
          {formatTime(currentDisplayTime)}
        </span>

        <div className="relative flex-1 flex items-center group cursor-pointer">
          {/* Background Bar */}
          <div className="w-full h-1.5 bg-rose-950/80 group-hover:h-2 rounded-full overflow-hidden transition-all">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Actual range input overlay */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentDisplayTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onTouchStart={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchEnd={handleSeekMouseUp}
            disabled={!hasTrack}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        <span className="text-xs font-mono text-rose-300/80 w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Action Buttons & Volume */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-glow-pink transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Track</span>
          </button>

          <button
            onClick={onToggleQueue}
            className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 hover:text-white transition-colors"
            title="Shared Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleChat}
            className="relative p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 hover:text-white transition-colors"
            title="Love Whispers & Chat"
          >
            <MessageCircleHeart className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Center: Main Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            disabled={!hasTrack}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white flex items-center justify-center shadow-glow-pink disabled:opacity-40 disabled:hover:scale-100 transform hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            disabled={!hasTrack}
            className="p-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 hover:text-white disabled:opacity-40 transition-all active:scale-95"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onSendHeart}
            className="p-3 rounded-xl bg-gradient-to-r from-rose-600/30 to-pink-600/30 hover:from-rose-600/50 hover:to-pink-600/50 border border-rose-500/40 text-rose-300 hover:text-white transition-all active:scale-90"
            title="Send Heart to Partner ❤️"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
          </button>
        </div>

        {/* Right: Personal Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-rose-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-rose-300" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-20 sm:w-24 accent-rose-500 h-1 bg-rose-950/80 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
