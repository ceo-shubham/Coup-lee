import React from 'react';
import { Disc, Music, Heart, Sparkles, User, Radio } from 'lucide-react';

export function VinylPlayer({
  track,
  isPlaying,
  onSendHeart,
  showVideo,
  onToggleVideo,
}) {
  const isYouTube = track?.type === 'youtube';

  return (
    <div className="flex flex-col items-center justify-center relative w-full py-4">
      {/* Vinyl Disc Container */}
      <div className="relative group">
        {/* Glowing aura behind vinyl */}
        <div
          className={`absolute -inset-4 rounded-full bg-gradient-to-tr from-rose-600/40 via-pink-500/30 to-rose-400/20 blur-2xl transition-all duration-1000 ${
            isPlaying ? 'opacity-90 scale-105 animate-pulse-glow' : 'opacity-30 scale-95'
          }`}
        />

        {/* Vinyl Record */}
        <div
          className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full vinyl-grooves border-4 border-rose-950/80 p-3 shadow-2xl flex items-center justify-center transition-transform ${
            isPlaying ? 'animate-spin-slow' : 'rotate-0'
          }`}
          style={{
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
        >
          {/* Vinyl inner rings */}
          <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-full border border-rose-500/20 flex items-center justify-center">
              {/* Center Album Art Label */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-rose-900 shadow-inner">
                <img
                  src={
                    track?.thumbnail ||
                    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={track?.title || 'Romantic Track'}
                  className="w-full h-full object-cover"
                />

                {/* Spindle hole */}
                <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-[#0d0207] border-2 border-rose-400/80 shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Quick Heart Tap Button */}
        <button
          onClick={onSendHeart}
          className="absolute -bottom-2 right-4 sm:right-6 w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border-2 border-white/40 shadow-glow-pink flex items-center justify-center text-white transform hover:scale-110 active:scale-90 transition-all z-20"
          title="Send Love Heart Burst ❤️"
        >
          <Heart className="w-6 h-6 fill-white animate-pulse" />
        </button>
      </div>

      {/* Track Details */}
      <div className="mt-6 text-center max-w-md px-4">
        {track ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-2">
              <Radio className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
              <span>{isPlaying ? 'Now Playing in Sync' : 'Paused in Sync'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate drop-shadow-md">
              {track.title || 'Untitled Track'}
            </h2>
            <p className="text-xs sm:text-sm text-rose-300/80 mt-0.5 truncate">
              {track.artist || 'Coup-le Audio'}
            </p>

            {/* Added By Badge */}
            {track.addedBy && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-rose-300/60">
                <span>Added with love by</span>
                <span className="font-semibold text-rose-200">{track.addedBy.name}</span>
              </div>
            )}

            {/* If YouTube, switch between Video and Vinyl */}
            {isYouTube && (
              <div className="mt-3">
                <button
                  onClick={onToggleVideo}
                  className="px-3 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-xs text-rose-200 transition-colors"
                >
                  {showVideo ? '🎵 Switch to Vinyl Mode' : '🎬 Switch to Video Mode'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-rose-300/60 text-sm">
            <p>No track currently playing</p>
            <p className="text-xs mt-1 text-rose-400/80">Add a YouTube link or upload an MP3 song to listen together!</p>
          </div>
        )}
      </div>

      {/* Animated Soundwave Equalizer Bars (when playing) */}
      {isPlaying && (
        <div className="flex items-end gap-1 h-5 mt-4">
          {[40, 80, 60, 100, 50, 70, 90, 45, 65, 85, 35].map((height, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-rose-600 to-pink-400 rounded-full animate-pulse"
              style={{
                height: `${height}%`,
                animationDuration: `${0.4 + (i % 4) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
