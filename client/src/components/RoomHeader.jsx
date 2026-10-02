import React, { useState, useEffect } from 'react';
import { Heart, Copy, Check, Users, Clock, ShieldCheck, LogOut, Share2, Sparkles } from 'lucide-react';
import { formatTime } from '../utils/youtubeParser';

export function RoomHeader({ room, currentUser, onLeaveRoom, isWakeLocked }) {
  const [copied, setCopied] = useState(false);
  const [togetherSeconds, setTogetherSeconds] = useState(0);

  // Live timer for together time
  useEffect(() => {
    if (!room?.togetherTimerStart) {
      setTogetherSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - room.togetherTimerStart) / 1000);
      setTogetherSeconds(elapsed > 0 ? elapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.togetherTimerStart]);

  const copyCode = () => {
    if (!room?.id) return;
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isPartnerConnected = (room?.users?.length || 0) >= 2;

  return (
    <header className="w-full glass-panel border-b border-rose-500/20 px-3.5 sm:px-6 py-2.5 sm:py-3 flex-shrink-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Branding & Numeric Code */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-glow-pink">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white hidden sm:inline">
              Coup<span className="text-rose-500">-</span>le
            </span>
          </div>

          {/* Numeric Room Code Badge (tap to copy) */}
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 rounded-xl px-2.5 sm:px-3 py-1.5 transition-all active:scale-95"
            title="Click to copy room code"
          >
            <span className="text-[10px] uppercase font-bold text-rose-300/80 tracking-wider">Room:</span>
            <span className="font-mono font-bold text-xs sm:text-sm md:text-base text-white tracking-widest">{room?.id}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-rose-300 ml-0.5" />
            )}
          </button>
        </div>

        {/* Center: Together Timer (Shows cleanly when partner is here) */}
        <div className="flex items-center justify-center">
          {isPartnerConnected ? (
            <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 rounded-full px-3 py-1 text-xs text-rose-200">
              <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">Together: </span>
              <span className="font-mono font-bold text-pink-300">{formatTime(togetherSeconds)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/30 rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-rose-300/80 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="hidden sm:inline">Waiting for partner</span>
              <span className="sm:hidden">Waiting...</span>
            </div>
          )}
        </div>

        {/* Right: Partner Avatars & Leave Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* User Avatars */}
          <div className="flex items-center -space-x-1.5 sm:-space-x-2">
            {room?.users?.map((u, i) => (
              <div key={i} className="relative group" title={`${u.user?.name} (${u.isCreator ? 'Host' : 'Partner'})`}>
                <img
                  src={u.user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.user?.name || 'User')}`}
                  alt={u.user?.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-rose-400 bg-rose-900"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border border-black rounded-full" />
              </div>
            ))}
          </div>

          {/* Desktop WakeLock */}
          {isWakeLocked && (
            <div
              className="hidden lg:flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-[11px] text-emerald-300"
              title="Screen Wake Lock is holding screen awake during playback"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>WakeLock Active</span>
            </div>
          )}

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-xs font-semibold text-rose-200 transition-all active:scale-95 shadow-sm"
            title="Leave Room"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </header>
  );
}
