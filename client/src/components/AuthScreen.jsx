import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, Music, Shield, Flame, Radio } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export function AuthScreen() {
  const { isGoogleConfigured, loginWithGoogle, loginCustom } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [useManualSetup, setUseManualSetup] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleCustomLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    loginCustom({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      avatar: selectedAvatar,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel-glow rounded-3xl p-8 border border-rose-500/30 relative z-10 shadow-2xl">
        {/* Logo & Romantic Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 shadow-glow-pink mb-4 animate-float">
            <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Coup<span className="text-rose-500">-</span>le
          </h1>
          <p className="text-rose-200/80 text-sm mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Listen & Watch Together in Sync
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          </p>
        </div>

        {/* Highlight Feature Badges */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-rose-950/40 border border-rose-900/40 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
            <Radio className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[11px] font-medium text-rose-200">Zero Lag Sync</span>
          </div>
          <div className="bg-rose-950/40 border border-rose-900/40 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
            <Music className="w-4 h-4 text-pink-400 mb-1" />
            <span className="text-[11px] font-medium text-pink-200">YT & Uploads</span>
          </div>
          <div className="bg-rose-950/40 border border-rose-900/40 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
            <Shield className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[11px] font-medium text-rose-200">Auto Purge</span>
          </div>
        </div>

        {/* Google OAuth Login Section */}
        {isGoogleConfigured && !useManualSetup ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center w-full py-2">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    loginWithGoogle(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  setGoogleError('Google Sign-in failed. Please try again.');
                }}
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
                width="340"
              />
            </div>

            {googleError && (
              <p className="text-xs text-rose-400 text-center">{googleError}</p>
            )}

            <button
              onClick={() => setUseManualSetup(true)}
              className="w-full text-center text-xs text-rose-300/70 hover:text-rose-200 transition-colors py-2"
            >
              Or enter custom partner nickname →
            </button>
          </div>
        ) : (
          /* Profile Setup Form (Fallback or Custom Mode) */
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-rose-200 uppercase tracking-wider mb-1.5">
                Your Name / Sweetheart Nickname
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex, Honey, Sunshine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-rose-300/40 text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-200 uppercase tracking-wider mb-1.5">
                Google / Account Email (optional)
              </label>
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-rose-300/40 text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-rose-200 uppercase tracking-wider mb-2">
                Choose Profile Avatar
              </label>
              <div className="flex items-center justify-between gap-2">
                {AVATAR_PRESETS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                      selectedAvatar === av
                        ? 'border-rose-500 ring-4 ring-rose-500/30 scale-105'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt={`Avatar ${idx}`} className="w-full h-full object-cover rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-glow-pink disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              <Flame className="w-4 h-4" />
              Enter Coup-le Room
            </button>

            {isGoogleConfigured && (
              <button
                type="button"
                onClick={() => setUseManualSetup(false)}
                className="w-full text-center text-xs text-rose-300/70 hover:text-rose-200 transition-colors pt-2"
              >
                ← Back to Google Login
              </button>
            )}
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-rose-900/30 text-center">
          <p className="text-[11px] text-rose-300/60 leading-relaxed">
            🔒 Auto-Purge: All uploaded songs and room sessions are permanently deleted when you leave or close the tab.
          </p>
        </div>
      </div>
    </div>
  );
}
