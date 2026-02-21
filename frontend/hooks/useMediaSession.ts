'use client';

import { useEffect } from 'react';

interface UseMediaSessionOptions {
  /** When false, metadata is cleared and action handlers are removed */
  enabled: boolean;
  metadata?: {
    title: string;
    artist: string;
    album?: string;
    artwork?: MediaImage[];
  };
  /** Called when the OS play signal fires (headphones, media keys, lock screen) */
  onPlay?: () => void;
  /** Called when the OS pause signal fires */
  onPause?: () => void;
}

/**
 * Integrates with the Web Media Session API to intercept OS media controls.
 *
 * IMPORTANT: The play/pause handlers intentionally do NOT call
 * audioElement.play()/pause() directly. Instead they delegate to
 * onPlay/onPause callbacks so the game logic controls playback timing.
 * This prevents hardware media keys from bypassing snippet duration limits.
 */
export function useMediaSession({
  enabled,
  metadata,
  onPlay,
  onPause,
}: UseMediaSessionOptions) {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    if (!enabled) {
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
      try {
        mediaSession.setActionHandler('play', null);
        mediaSession.setActionHandler('pause', null);
      } catch {
        // Some browsers don't support clearing handlers
      }
      return;
    }

    // Set metadata when enabled
    if (metadata) {
      mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: metadata.artwork ?? [],
      });
    }

    // Intercept play/pause — delegate to game callbacks, never touch the audio element
    mediaSession.setActionHandler('play', () => {
      onPlay?.();
    });

    mediaSession.setActionHandler('pause', () => {
      onPause?.();
    });

    return () => {
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
      try {
        mediaSession.setActionHandler('play', null);
        mediaSession.setActionHandler('pause', null);
      } catch {
        // Some browsers don't support clearing handlers
      }
    };
  }, [enabled, metadata, onPlay, onPause]);
}
