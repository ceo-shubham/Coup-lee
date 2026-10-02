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
  const isSyncingRef = useRef(false);
  const [duration, setDuration] = useState(0);

  // When track changes, update src
  useEffect(() => {
    if (!track || !audioRef.current) return;
    const audio = audioRef.current;

    const streamUrl = track.url?.startsWith('http')
      ? track.url
      : `${SERVER_URL}${track.url || ''}`;

    audio.src = streamUrl;
    audio.load();

    if (playback?.currentTime) {
      audio.currentTime = playback.currentTime;
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
    const drift = Math.abs(audio.currentTime - (playback.currentTime || 0));

    isSyncingRef.current = true;

    // Correct drift if more than 0.5s
    if (drift > 0.5) {
      audio.currentTime = playback.currentTime;
    }

    if (playback.isPlaying && audio.paused) {
      audio.play().catch((err) => console.warn('[AudioPlayer] Play error:', err));
    } else if (!playback.isPlaying && !audio.paused) {
      audio.pause();
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 300);
  }, [playback, lastSyncEvent]);

  // Volume & Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlay = () => {
    if (isSyncingRef.current || !audioRef.current) return;
    onPlaybackChange(true, audioRef.current.currentTime);
  };

  const handlePause = () => {
    if (isSyncingRef.current || !audioRef.current) return;
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

  return (
    <div className="hidden">
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onTrackEnded}
      />
    </div>
  );
}
