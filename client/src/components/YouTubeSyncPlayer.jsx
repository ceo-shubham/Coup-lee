import React, { useEffect, useRef, useState } from 'react';
import { extractYouTubeId } from '../utils/youtubeParser';
import { Volume2, VolumeX, Sparkles, ExternalLink, AlertCircle, Play } from 'lucide-react';

// Load YouTube IFrame API script once
let ytApiPromise = null;
function loadYouTubeApi() {
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }
      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
  }
  return ytApiPromise;
}

export function YouTubeSyncPlayer({
  track,
  playback,
  lastSyncEvent,
  onPlaybackChange,
  onTrackEnded,
  onTimeUpdate,
  volume,
  isMuted,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const suppressEventsUntilRef = useRef(Date.now() + 4000);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  const videoId = track ? (track.videoId || extractYouTubeId(track.url)) : null;

  // Initialize or re-create YouTube Player when track changes
  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;
    setIsVideoLoading(true);
    setPlayerError(null);
    // Lock broadcast events for 4 seconds during new track load & buffer
    suppressEventsUntilRef.current = Date.now() + 4000;

    loadYouTubeApi().then((YT) => {
      if (!isMounted || !containerRef.current) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      // Create new container element for iframe
      const playerId = `yt-player-${Date.now()}`;
      containerRef.current.innerHTML = `<div id="${playerId}" class="w-full h-full rounded-2xl"></div>`;

      playerRef.current = new YT.Player(playerId, {
        videoId: videoId,
        playerVars: {
          autoplay: playback?.isPlaying ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            isReadyRef.current = true;
            setIsVideoLoading(false);
            event.target.setVolume(isMuted ? 0 : volume * 100);

            // First match track time smoothly with room before playing
            let targetStartTime = playback?.currentTime || 0;
            if (playback?.isPlaying && playback?.lastUpdated) {
              const elapsed = (Date.now() - playback.lastUpdated) / 1000;
              if (elapsed > 0 && elapsed < 7200) {
                targetStartTime += elapsed;
              }
            }

            if (targetStartTime > 0.5) {
              event.target.seekTo(targetStartTime, true);
            }

            if (playback?.isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }

            if (onTimeUpdate && typeof event.target.getDuration === 'function') {
              try {
                const dur = event.target.getDuration() || 0;
                onTimeUpdate(targetStartTime, dur);
              } catch {}
            }

            // Keep events locked until initial track sync is stable
            suppressEventsUntilRef.current = Date.now() + 3500;
          },
          onStateChange: (event) => {
            if (!isMounted) return;

            const state = event.data;
            const currentTime = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
            const duration = playerRef.current?.getDuration ? playerRef.current.getDuration() : 0;

            if (state === YT.PlayerState.PLAYING) {
              setIsActuallyPlaying(true);
              if (Date.now() >= suppressEventsUntilRef.current) {
                onPlaybackChange(true, currentTime);
              }
            } else if (state === YT.PlayerState.PAUSED) {
              setIsActuallyPlaying(false);
              // Ignore pause if tab was minimized/hidden by browser
              if (document.visibilityState === 'hidden') {
                return;
              }
              if (Date.now() >= suppressEventsUntilRef.current) {
                onPlaybackChange(false, currentTime);
              }
            } else if (state === YT.PlayerState.ENDED) {
              setIsActuallyPlaying(false);
              // Validate genuine track completion:
              // YouTube Iframe API frequently emits state 0 (ENDED) during initial buffering or resolution switches.
              // Only trigger onTrackEnded if current time is within 4 seconds of the full duration.
              const isLegitimateEnd = (duration > 10 && currentTime >= duration - 4) || (duration > 0 && duration <= 10 && currentTime >= duration - 1.5);
              if (isLegitimateEnd) {
                console.log('[YouTube Player] Song legitimately finished playing to end:', currentTime, '/', duration);
                onTrackEnded();
              } else {
                console.warn('[YouTube Player] Suppressed false/premature ENDED event at', currentTime, 'of', duration);
                // Auto-recover and resume if supposed to be playing
                if (playback?.isPlaying && typeof playerRef.current?.playVideo === 'function') {
                  try {
                    playerRef.current.playVideo();
                  } catch (e) {}
                }
              }
            }
          },
          onError: (err) => {
            console.warn('[YouTube Player] Error:', err);
            const code = err?.data;
            let msg = 'Playback error occurred with this video.';
            if (code === 101 || code === 150) {
              msg = 'Playback is restricted on third-party sites by the owner. Please pick another video or upload audio directly.';
            } else if (code === 100) {
              msg = 'Video not found or has been set to private.';
            } else if (code === 2) {
              msg = 'Invalid YouTube video ID.';
            }
            setPlayerError(msg);
            setIsVideoLoading(false);
          },
        },
      });
    });

    return () => {
      isMounted = false;
      isReadyRef.current = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoId]);

  // Handle visibility return (resume video if supposed to be playing)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && playback?.isPlaying && playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.playVideo();
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [playback?.isPlaying]);

  // Handle remote playback sync from partner
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current || !playback) return;

    const player = playerRef.current;
    const currentLocalTime = player.getCurrentTime ? player.getCurrentTime() : 0;

    // Calculate actual target time including transit elapsed time
    let targetTime = playback.currentTime || 0;
    if (playback.isPlaying && playback.lastUpdated) {
      const elapsed = (Date.now() - playback.lastUpdated) / 1000;
      if (elapsed > 0 && elapsed < 10) {
        targetTime += elapsed;
      }
    }

    const drift = Math.abs(currentLocalTime - targetTime);

    // Lock local events so this programmatic adjustment doesn't bounce back to partner
    suppressEventsUntilRef.current = Date.now() + 1500;

    // Only seek if drift is noticeably apart (> 2.5 seconds) to avoid constant stutter-replay
    if (drift > 2.5 && typeof player.seekTo === 'function') {
      player.seekTo(targetTime, true);
    }

    // Sync play/pause state
    const playerState = player.getPlayerState ? player.getPlayerState() : -1;
    if (playback.isPlaying && playerState !== 1) {
      if (typeof player.playVideo === 'function') {
        player.playVideo();
      }
    } else if (!playback.isPlaying && playerState === 1) {
      if (typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    }
  }, [playback, lastSyncEvent]);

  // Volume & Mute sync (local preference)
  useEffect(() => {
    if (playerRef.current && isReadyRef.current) {
      try {
        if (isMuted) {
          playerRef.current.setVolume(0);
        } else {
          playerRef.current.setVolume(volume * 100);
        }
      } catch (e) {}
    }
  }, [volume, isMuted]);

  // Live progress updates to bottom scrubber bar
  useEffect(() => {
    if (!playback?.isPlaying || !onTimeUpdate) return;
    const interval = setInterval(() => {
      if (playerRef.current && isReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          onTimeUpdate(cur, dur);
        } catch {}
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playback?.isPlaying, onTimeUpdate]);

  return (
    <div className="relative w-full aspect-video max-h-[24vh] max-w-sm sm:max-w-md mx-auto rounded-2xl overflow-hidden glass-panel-glow border border-rose-500/30 shadow-xl bg-black touch-auto">
      <div ref={containerRef} className="w-full h-full" />

      {/* Autoplay blocked fallback tap button */}
      {playback?.isPlaying && !isActuallyPlaying && !isVideoLoading && !playerError && (
        <button
          onClick={() => {
            if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
              playerRef.current.playVideo();
            }
          }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 hover:bg-black/20 transition-all cursor-pointer group"
          title="Click to play and sync audio"
        >
          <div className="w-12 h-12 rounded-full bg-rose-600/90 group-hover:bg-rose-500 border border-white/50 shadow-glow-pink flex items-center justify-center text-white transform group-hover:scale-110 active:scale-95 transition-all">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow mt-2">Tap to Play Audio</span>
        </button>
      )}

      {isVideoLoading && !playerError && (
        <div className="absolute inset-0 bg-[#12040a]/90 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin" />
          <p className="text-sm font-semibold text-rose-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-400" />
            Synchronizing YouTube Stream...
          </p>
        </div>
      )}

      {playerError && (
        <div className="absolute inset-0 bg-[#12040a]/95 flex flex-col items-center justify-center gap-3 z-20 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" />
          <h4 className="text-white font-bold text-base">Cannot Play YouTube Video</h4>
          <p className="text-xs text-rose-300 max-w-sm">{playerError}</p>
        </div>
      )}
    </div>
  );
}
