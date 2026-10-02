import React from 'react';
import { Heart, Radio } from 'lucide-react';

export function VinylPlayer({
  track,
  isPlaying,
  onSendHeart,
  showVideo,
  onToggleVideo,
}) {
  const isYouTube = track?.type === 'youtube';

  return (
    <div className="flex flex-col items-center justify-center relative w-full py-2 sm:py-4 select-none">
      {/* Vinyl Disc Container */}
      <div className="relative group flex items-center justify-center">
        {/* Glowing aura behind vinyl */}
        <div
          className={`absolute -inset-4 rounded-full bg-gradient-to-tr from-rose-600/40 via-pink-500/30 to-rose-400/20 blur-2xl transition-all duration-1000 ${
            isPlaying ? 'opacity-90 scale-105 animate-pulse-glow' : 'opacity-30 scale-95'
          }`}
        />

        {/* Vinyl Record */}
        <div
          className={`relative w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 max-h-[36vh] max-w-[36vh] aspect-square rounded-full vinyl-grooves border-4 border-rose-950/80 p-3 shadow-2xl flex items-center justify-center transition-transform ${
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
              <div className="relative w-22 h-22 xs:w-26 xs:h-26 sm:w-30 sm:h-30 md:w-34 md:h-34 rounded-full overflow-hidden border-2 sm:border-4 border-rose-900 shadow-inner">
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
          className="absolute -bottom-1 right-2 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border-2 border-white/40 shadow-glow-pink flex items-center justify-center text-white transform hover:scale-110 active:scale-90 transition-all z-20"
          title="Send Love Heart Burst ❤️"
        >
          <Heart className="w-5 h-5 fill-white animate-pulse" />
        </button>
      </div>

      {/* Track Details - Clean and spacious without visual clutter */}
      <div className="mt-3 sm:mt-5 text-center max-w-sm sm:max-w-md px-4 flex-shrink-0">
        {track ? (
          <>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate drop-shadow-md">
              {track.title || 'Untitled Track'}
            </h2>
            <p className="text-xs sm:text-sm text-rose-300/80 mt-1 truncate">
              {track.artist || 'Coup-le Audio'}
              {track.addedBy?.name && (
                <span className="text-rose-400/70"> • {track.addedBy.name}</span>
              )}
            </p>

            {/* Switch between Video and Vinyl for YouTube */}
            {isYouTube && (
              <div className="mt-2">
                <button
                  onClick={onToggleVideo}
                  className="px-3 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-xs text-rose-200 transition-colors"
                >
                  {showVideo ? '🎵 Switch to Vinyl' : '🎬 Switch to Video'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-rose-300/60 text-xs sm:text-sm">
            <p className="font-medium text-white/90">No track playing</p>
            <p className="text-[11px] mt-0.5 text-rose-400/80">Add a YouTube link or upload an MP3 song to listen together!</p>
          </div>
        )}

        {/* Animated Soundwave Equalizer Bars */}
        {isPlaying && (
          <div className="flex items-end justify-center gap-1.5 h-4 mt-2.5">
            {[40, 80, 60, 100, 50, 75, 90, 45, 65].map((height, i) => (
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
    </div>
  );
}
