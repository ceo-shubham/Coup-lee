import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Plus, LogIn, Sparkles, Copy, Check, LogOut, Music2, Share2 } from 'lucide-react';

export function RoomJoinCreate({ onCreateRoom, onJoinRoom, loading, error, clearError }) {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState('select'); // 'select', 'join'
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-detect room parameter from URL (e.g., ?room=123456)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && /^\d{6}$/.test(roomParam)) {
      setMode('join');
      setJoinCode(roomParam);
    }
  }, []);

  const handleJoinSubmit = (e) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(joinCode)) return;
    onJoinRoom(joinCode);
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setJoinCode(val);
    if (error) clearError();
    // Auto-submit when all 6 digits entered
    if (val.length === 6) {
      onJoinRoom(val);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-8 border border-rose-500/30 relative z-10 shadow-2xl">
        {/* User bar */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-rose-900/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-rose-400/80 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1a050f] rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5">
                {user?.name}
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
              </h3>
              <p className="text-xs text-rose-300/70">{user?.email || 'Connected'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-xs text-rose-300 transition-all active:scale-95"
            title="Switch Account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Sync <span className="romantic-shimmer">in Love?</span>
          </h2>
          <p className="text-xs sm:text-sm text-rose-200/70 mt-1">
            Create a private 6-digit room or enter your partner's code
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs sm:text-sm flex items-center justify-between animate-shake">
            <span>⚠️ {error}</span>
            <button onClick={clearError} className="text-rose-400 hover:text-white text-xs font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Selection mode or Join mode */}
        {mode === 'select' ? (
          <div className="space-y-4">
            {/* Create Room Button */}
            <button
              onClick={onCreateRoom}
              disabled={loading}
              className="w-full group p-5 rounded-2xl bg-gradient-to-r from-rose-600/90 to-pink-600/90 hover:from-rose-500 hover:to-pink-500 border border-rose-400/30 text-left transition-all duration-300 shadow-glow-pink transform hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base sm:text-lg">Create a New Room</h4>
                    <p className="text-xs text-rose-100/80">Get a 6-digit numeric code to share with your partner</p>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-rose-200 group-hover:scale-125 transition-transform" />
              </div>
            </button>

            {/* Join Room Button */}
            <button
              onClick={() => setMode('join')}
              disabled={loading}
              className="w-full group p-5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/30 text-left transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-rose-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base sm:text-lg">Join Existing Room</h4>
                    <p className="text-xs text-rose-300/70">Enter partner's 6-digit numeric code</p>
                  </div>
                </div>
                <Music2 className="w-5 h-5 text-rose-400/60 group-hover:text-rose-300 transition-colors" />
              </div>
            </button>
          </div>
        ) : (
          /* Join Code Input Form */
          <form onSubmit={handleJoinSubmit} className="space-y-6">
            <div className="text-center">
              <label className="block text-xs font-semibold text-rose-200 uppercase tracking-widest mb-3">
                Enter 6-Digit Numeric Code
              </label>
              <div className="flex justify-center mb-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={joinCode}
                  onChange={handleCodeChange}
                  placeholder="• • • • • •"
                  className="w-64 tracking-[0.6em] text-center font-mono font-extrabold text-2xl sm:text-3xl py-3 px-4 rounded-2xl glass-input text-white border-2 border-rose-500/40 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/30"
                />
              </div>
              <p className="text-xs text-rose-300/70">
                Code consists only of numbers (e.g. 582910)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('select');
                  setJoinCode('');
                  if (error) clearError();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800/50 text-xs sm:text-sm font-semibold text-rose-200 transition-all"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={joinCode.length !== 6 || loading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs sm:text-sm font-bold shadow-glow-pink disabled:opacity-40 transition-all hover:opacity-95 active:scale-98"
              >
                {loading ? 'Connecting...' : 'Join Partner ❤️'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-[11px] text-rose-400/60 flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          Designed for couples to vibe in real-time
        </div>
      </div>
    </div>
  );
}
