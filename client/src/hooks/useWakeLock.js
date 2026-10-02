import { useEffect, useRef, useState, useCallback } from 'react';

export function useWakeLock(isActive = true) {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef(null);
  const audioContextRef = useRef(null);
  const silentNodeRef = useRef(null);

  // Request WakeLock to prevent device screen sleep
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && isActive) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsLocked(true);
        console.log('[WakeLock] Screen wake lock acquired ❤️');

        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false);
          console.log('[WakeLock] Screen wake lock released');
        });
      } catch (err) {
        console.warn('[WakeLock] Request failed:', err.message);
      }
    }
  }, [isActive]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsLocked(false);
      } catch (err) {
        console.warn('[WakeLock] Release failed:', err.message);
      }
    }
  }, []);

  // Background audio keep-alive (keeps audio context active when tab minimized)
  const startBackgroundAudioKeepAlive = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
          // Create silent oscillator to keep mobile audio session alive
          const oscillator = audioContextRef.current.createOscillator();
          const gain = audioContextRef.current.createGain();
          gain.gain.value = 0.0001; // Inaudible
          oscillator.connect(gain);
          gain.connect(audioContextRef.current.destination);
          oscillator.start();
          silentNodeRef.current = { oscillator, gain };
          console.log('[AudioEngine] Background keep-alive initialized');
        }
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn('[AudioEngine] Background keep-alive error:', e);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      requestWakeLock();
      startBackgroundAudioKeepAlive();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
      if (silentNodeRef.current) {
        try {
          silentNodeRef.current.oscillator.stop();
        } catch {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
    };
  }, [isActive, requestWakeLock, releaseWakeLock, startBackgroundAudioKeepAlive]);

  return { isLocked, requestWakeLock, releaseWakeLock };
}
