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
    <div className="flex flex-col items-center justify-center relative w-full py-1 sm:py-2 select-none">
      {/* Vinyl Disc Container */}
      <div className="relative group flex items-center justify-center">
        {/* Glowing aura behind vinyl */}
        <div
          className={`absolute -inset-3 rounded-full bg-gradient-to-tr from-rose-600/40 via-pink-500/30 to-rose-400/20 blur-xl sm:blur-2xl transition-all duration-1000 ${
            isPlaying ? 'opacity-90 scale-105 animate-pulse-glow' : 'opacity-30 scale-95'
          }`}
        />

        {/* Vinyl Record - Scaled dynamically to never overflow viewport */}
        <div
          className={`relative w-40 h-40 xs:w-48 xs:h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 lg:w-72 lg:h-72 max-h-[34vh] max-w-[34vh] aspect-square rounded-full vinyl-grooves border-4 border-rose-950/80 p-2 sm:p-3 shadow-2xl flex items-center justify-center transition-transform ${
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
              <div className="relative w-18 h-18 xs:w-22 xs:h-22 sm:w-26 sm:h-26 md:w-30 md:h-30 lg:w-34 lg:h-34 rounded-full overflow-hidden border-2 sm:border-4 border-rose-900 shadow-inner">
                <img
                  src={
                    track?.thumbnail ||
                    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={track?.title || 'Romantic Track'}
                  className="w-full h-full object-cover"
                />

                {/* Spindle hole */}
                <div className="absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0d0207] border-2 border-rose-400/80 shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Quick Heart Tap Button */}
        <button
          onClick={onSendHeart}
          className="absolute -bottom-1 right-2 sm:right-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border-2 border-white/40 shadow-glow-pink flex items-center justify-center text-white transform hover:scale-110 active:scale-90 transition-all z-20"
          title="Send Love Heart Burst ❤️"
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white animate-pulse" />
        </button>
      </div>

      {/* Track Details */}
      <div className="mt-2 sm:mt-3 text-center max-w-md px-3 flex-shrink-0">
        {track ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] sm:text-xs mb-1">
              <Radio className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
              <span>{isPlaying ? 'Now Playing in Sync' : 'Paused in Sync'}</span>
            </div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white truncate drop-shadow-md">
              {track.title || 'Untitled Track'}
            </h2>
            <p className="text-xs text-rose-300/80 mt-0.5 truncate">
              {track.artist || 'Coup-le Audio'}
            </p>

            {/* Added By Badge */}
            {track.addedBy && (
              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-rose-300/60">
                <span>Added with love by</span>
                <span className="font-semibold text-rose-200">{track.addedBy.name}</span>
              </div>
            )}

            {/* If YouTube, switch between Video and Vinyl */}
            {isYouTube && (
              <div className="mt-1.5">
                <button
                  onClick={onToggleVideo}
                  className="px-2.5 py-0.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-[11px] text-rose-200 transition-colors"
                >
                  {showVideo ? '🎵 Switch to Vinyl Mode' : '🎬 Switch to Video Mode'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-1 text-rose-300/60 text-xs sm:text-sm">
            <p>No track currently playing</p>
            <p className="text-[11px] mt-0.5 text-rose-400/80">Add a YouTube link or upload an MP3 song to listen together!</p>
          </div>
        )}
      </div>

      {/* Animated Soundwave Equalizer Bars (when playing) */}
      {isPlaying && (
        <div className="flex items-end gap-1 h-3.5 sm:h-4 mt-1.5 sm:mt-2">
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
