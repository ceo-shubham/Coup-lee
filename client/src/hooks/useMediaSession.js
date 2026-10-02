import { useEffect } from 'react';

export function useMediaSession({ currentTrack, isPlaying, onPlay, onPause, onNext, onSeek }) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Romantic Track',
        artist: currentTrack.artist || 'Coup-le Sync',
        album: 'Coup-le Couple Session ❤️',
        artwork: [
          {
            src: currentTrack.thumbnail || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=512',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // Set action handlers
      const actionHandlers = [
        ['play', onPlay],
        ['pause', onPause],
        ['nexttrack', onNext],
        ['seekto', (details) => {
          if (details.seekTime && onSeek) {
            onSeek(details.seekTime);
          }
        }],
      ];

      for (const [action, handler] of actionHandlers) {
        try {
          if (handler) {
            navigator.mediaSession.setActionHandler(action, handler);
          } else {
            navigator.mediaSession.setActionHandler(action, null);
          }
        } catch (e) {
          // Action not supported on this browser
        }
      }
    } catch (err) {
      console.warn('[MediaSession] Setup warning:', err);
    }
  }, [currentTrack, isPlaying, onPlay, onPause, onNext, onSeek]);
}
