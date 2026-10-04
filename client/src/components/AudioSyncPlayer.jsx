import React, { useEffect, useRef, useState } from 'react';
import { Music, Disc, Sparkles } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function AudioSyncPlayer({
  track,
  playback,
  lastSyncEvent,
  onPlaybackChange,
  onTrackEnded,
  onTimeUpdate,
  volume,
  isMuted,
}) {
  const audioRef = useRef(null);
  const suppressEventsUntilRef = useRef(Date.now() + 3000);
  const [duration, setDuration] = useState(0);

  // When track changes, update src
  useEffect(() => {
    if (!track || !audioRef.current) return;
    const audio = audioRef.current;

    const streamUrl = track.url?.startsWith('http')
      ? track.url
      : `${SERVER_URL}${track.url || ''}`;

    suppressEventsUntilRef.current = Date.now() + 3000;
    audio.src = streamUrl;
    audio.load();

    let targetTime = playback?.currentTime || 0;
    if (playback?.isPlaying && playback?.lastUpdated) {
      const elapsed = (Date.now() - playback.lastUpdated) / 1000;
      if (elapsed > 0 && elapsed < 7200) {
        targetTime += elapsed;
      }
    }

    if (targetTime > 0.5) {
      audio.currentTime = targetTime;
    }

    if (playback?.isPlaying) {
      audio.play().catch((err) => {
        console.warn('[AudioPlayer] Autoplay prevented:', err);
      });
    }
  }, [track?.id]);

  // Sync playback status with partner
  useEffect(() => {
    if (!audioRef.current || !playback) return;
    const audio = audioRef.current;

    let targetTime = playback.currentTime || 0;
    if (playback.isPlaying && playback.lastUpdated) {
      const elapsed = (Date.now() - playback.lastUpdated) / 1000;
      if (elapsed > 0 && elapsed < 10) {
        targetTime += elapsed;
      }
    }

    const drift = Math.abs(audio.currentTime - targetTime);

    suppressEventsUntilRef.current = Date.now() + 1200;

    // Correct drift if more than 2 seconds (smooth sync without stutter)
    if (drift > 2.0) {
      audio.currentTime = targetTime;
    }

    if (playback.isPlaying && audio.paused) {
      audio.play().catch((err) => console.warn('[AudioPlayer] Play error:', err));
    } else if (!playback.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [playback, lastSyncEvent]);

  // Volume & Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Keep background audio active when tab is minimized or screen is locked
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (playback?.isPlaying && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch((err) => {
          console.warn('[AudioPlayer] Background resume error:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [playback?.isPlaying]);

  const handlePlay = () => {
    if (Date.now() < suppressEventsUntilRef.current || !audioRef.current) return;
    onPlaybackChange(true, audioRef.current.currentTime);
  };

  const handlePause = () => {
    // If the browser backgrounded the tab or user locked screen, do NOT broadcast pause to partner!
    if (document.visibilityState === 'hidden') {
      if (playback?.isPlaying && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    if (Date.now() < suppressEventsUntilRef.current || !audioRef.current) return;
    onPlaybackChange(false, audioRef.current.currentTime);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    onTimeUpdate(audioRef.current.currentTime, audioRef.current.duration || 0);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      onTimeUpdate(audioRef.current.currentTime, audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration || 0;
      const cur = audioRef.current.currentTime || 0;
      if (dur > 5 && cur < dur - 3) {
        console.warn('[Audio Player] Ignoring premature ended event at', cur, 'of', dur);
        return;
      }
    }
    onTrackEnded();
  };

  return (
    <div style={{ position: 'fixed', bottom: -500, left: -500, opacity: 0.001, pointerEvents: 'none' }}>
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  );
}
