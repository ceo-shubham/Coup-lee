import React from 'react';
import { Heart } from 'lucide-react';

export function VinylPlayer({
  track,
  isPlaying,
  onSendHeart,
  showVideo,
  onToggleVideo,
  isHost,
}) {
  const isYouTube = track?.type === 'youtube';

  return (
    <div className="flex flex-col items-center justify-center relative w-full py-1 select-none touch-auto">
      {/* Vinyl / CD Container - Compact preview disc */}
      <div className="relative group flex items-center justify-center">
        {/* Glowing aura behind disc */}
        <div
          className={`absolute -inset-3 rounded-full bg-gradient-to-tr from-rose-600/40 via-pink-500/30 to-rose-400/20 blur-xl sm:blur-2xl transition-all duration-1000 ${
            isPlaying ? 'opacity-90 scale-105 animate-pulse-glow' : 'opacity-25 scale-95'
          }`}
        />

        {/* Vinyl / CD Record */}
        <div
          className={`relative w-36 h-36 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 max-h-[25vh] max-w-[25vh] aspect-square rounded-full vinyl-grooves border-2 sm:border-4 border-rose-950/80 p-2 sm:p-2.5 shadow-2xl flex items-center justify-center transition-transform ${
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
              <div className="relative w-16 h-16 xs:w-18 xs:h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full overflow-hidden border sm:border-2 border-rose-900 shadow-inner">
                <img
                  src={
                    track?.thumbnail ||
                    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={track?.title || 'Romantic Track'}
                  className="w-full h-full object-cover"
                />

                {/* Spindle hole */}
                <div className="absolute inset-0 m-auto w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#0d0207] border border-rose-400/80 shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Quick Heart Tap Button */}
        <button
          onClick={onSendHeart}
          className="absolute -bottom-0.5 right-1.5 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border border-white/40 shadow-glow-pink flex items-center justify-center text-white transform hover:scale-110 active:scale-90 transition-all z-20"
          title="Send Love Heart Burst ❤️"
        >
          <Heart className="w-4 h-4 fill-white animate-pulse" />
        </button>
      </div>

      {/* Track Details - Compact, readable, elegant */}
      <div className="mt-2 sm:mt-3 text-center max-w-xs sm:max-w-md px-3 flex-shrink-0">
        {track ? (
          <>
            <h2 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-md">
              {track.title || 'Untitled Track'}
            </h2>
            <p className="text-[11px] sm:text-xs text-rose-300/80 mt-0.5 truncate">
              {track.artist || 'Coup-le Audio'}
              {track.addedBy?.name && (
                <span className="text-rose-400/70"> • {track.addedBy.name}</span>
              )}
            </p>

            {/* Switch between Video and Vinyl for YouTube */}
            {isYouTube && (
              <div className="mt-1.5 flex items-center justify-center">
                {isHost ? (
                  <button
                    onClick={onToggleVideo}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600/80 to-pink-600/80 hover:from-rose-500 hover:to-pink-500 border border-rose-400/40 text-[10px] sm:text-xs text-white font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                    title="Room Creator Control: Toggle Video or CD for the room"
                  >
                    <span>{showVideo ? '🎵 Switch to CD' : '🎬 Switch to Video'}</span>
                    <span className="text-[9px] bg-black/30 px-1 py-0.2 rounded text-rose-200">Host</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-[10px] text-rose-300/80">
                    {showVideo ? '🎬 Video View' : '🎵 CD View (Set by Host)'}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-1 text-rose-300/60 text-xs sm:text-sm">
            <p className="font-medium text-white/90">No track playing</p>
            <p className="text-[10px] sm:text-xs mt-0.5 text-rose-400/80">Add a YouTube link or upload an MP3 song to listen together!</p>
          </div>
        )}

        {/* Animated Soundwave Equalizer Bars */}
        {isPlaying && (
          <div className="flex items-end justify-center gap-1 h-3 sm:h-3.5 mt-1.5">
            {[40, 80, 60, 100, 50, 75, 90, 45, 65].map((height, i) => (
              <div
                key={i}
                className="w-0.5 sm:w-1 bg-gradient-to-t from-rose-600 to-pink-400 rounded-full animate-pulse"
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
