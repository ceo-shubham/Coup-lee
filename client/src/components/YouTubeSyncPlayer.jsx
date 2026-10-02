import React, { useEffect, useRef, useState } from 'react';
import { extractYouTubeId } from '../utils/youtubeParser';
import { Volume2, VolumeX, Sparkles, ExternalLink, AlertCircle } from 'lucide-react';

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
  volume,
  isMuted,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const isSyncingRef = useRef(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [playerError, setPlayerError] = useState(null);

  const videoId = track ? (track.videoId || extractYouTubeId(track.url)) : null;

  // Initialize or re-create YouTube Player when track changes
  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;
    setIsVideoLoading(true);
    setPlayerError(null);

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

            // Initial seek & state sync
            if (playback?.currentTime) {
              event.target.seekTo(playback.currentTime, true);
            }
            if (playback?.isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
          onStateChange: (event) => {
            if (!isMounted || isSyncingRef.current) return;

            const state = event.data;
            const currentTime = playerRef.current?.getCurrentTime() || 0;

            if (state === YT.PlayerState.PLAYING) {
              onPlaybackChange(true, currentTime);
            } else if (state === YT.PlayerState.PAUSED) {
              onPlaybackChange(false, currentTime);
            } else if (state === YT.PlayerState.ENDED) {
              onTrackEnded();
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

  // Handle remote playback sync from partner
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current || !playback) return;

    const player = playerRef.current;
    const currentLocalTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const targetTime = playback.currentTime || 0;
    const drift = Math.abs(currentLocalTime - targetTime);

    isSyncingRef.current = true;

    // Correct drift if more than 1.2s
    if (drift > 1.2 && typeof player.seekTo === 'function') {
      player.seekTo(targetTime, true);
    }

    // Sync play/pause
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

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 400);
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

  return (
    <div className="relative w-full aspect-video max-h-[460px] rounded-2xl overflow-hidden glass-panel-glow border border-rose-500/30 shadow-2xl bg-black">
      <div ref={containerRef} className="w-full h-full" />

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
