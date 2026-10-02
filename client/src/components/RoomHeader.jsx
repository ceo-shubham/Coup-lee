import React, { useState, useEffect } from 'react';
import { Heart, Copy, Check, Users, Clock, ShieldCheck, LogOut, Share2, Sparkles } from 'lucide-react';
import { formatTime } from '../utils/youtubeParser';

export function RoomHeader({ room, currentUser, onLeaveRoom, isWakeLocked }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const copyInviteLink = () => {
    if (!room?.id) return;
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const otherUsers = room?.users?.filter((u) => u.socketId !== currentUser?.id && u.user?.name !== currentUser?.name) || [];

  return (
    <header className="w-full glass-panel border-b border-rose-500/20 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Numeric Code */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-glow-pink">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
              Coup<span className="text-rose-500">-</span>le
            </span>
          </div>

          {/* Numeric Room Code Badge */}
          <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-1.5">
            <span className="text-[10px] uppercase font-bold text-rose-300/80 tracking-wider">Room:</span>
            <span className="font-mono font-bold text-sm sm:text-base text-white tracking-widest">{room?.id}</span>
            <button
              onClick={copyCode}
              className="ml-1 p-1 hover:bg-rose-800/40 rounded-lg text-rose-300 transition-colors"
              title="Copy 6-Digit Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={copyInviteLink}
              className="p-1 hover:bg-rose-800/40 rounded-lg text-rose-300 transition-colors"
              title="Copy Direct Invite Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Center: Together Duration & Partner Presence */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Together timer */}
          {room?.users?.length >= 2 ? (
            <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 rounded-full px-3 py-1 text-xs text-rose-200">
              <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Together: </span>
              <span className="font-mono font-bold text-pink-300">{formatTime(togetherSeconds)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/30 rounded-full px-3 py-1 text-xs text-rose-300/80 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Waiting for partner (Share code: {room?.id})</span>
            </div>
          )}

          {/* Connected User Avatars */}
          <div className="flex items-center -space-x-2">
            {room?.users?.map((u, i) => (
              <div key={i} className="relative group" title={`${u.user?.name} (${u.isCreator ? 'Host' : 'Partner'})`}>
                <img
                  src={u.user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.user?.name || 'User')}`}
                  alt={u.user?.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-rose-400 bg-rose-900"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: WakeLock badge & Leave button */}
        <div className="flex items-center gap-2">
          {isWakeLocked && (
            <div
              className="hidden lg:flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-[11px] text-emerald-300"
              title="Screen Wake Lock is holding screen awake during playback"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>WakeLock Active</span>
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-xs font-semibold text-rose-200 transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </header>
  );
}
