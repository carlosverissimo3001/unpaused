'use client';

import { useEffect, useRef } from 'react';

interface MediaMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: MediaImage[];
}

interface UseMediaSessionOptions {
  audioElement: HTMLAudioElement | null;
  metadata?: MediaMetadata;
  onPlay?: () => void;
  onPause?: () => void;
}

/**
 * Hook to integrate Web Media Session API for OS media controls
 */
export function useMediaSession({
  audioElement,
  metadata,
  onPlay,
  onPause,
}: UseMediaSessionOptions) {
  const metadataRef = useRef<MediaMetadata | undefined>(metadata);

  // Update metadata ref when it changes
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return; // Media Session API not supported
    }

    const mediaSession = navigator.mediaSession;

    // Set metadata
    if (metadataRef.current) {
      mediaSession.metadata = new MediaMetadata({
        title: metadataRef.current.title,
        artist: metadataRef.current.artist,
        album: metadataRef.current.album,
        artwork: metadataRef.current.artwork || [],
      });
    }

    // Set action handlers
    mediaSession.setActionHandler('play', () => {
      if (audioElement && audioElement.paused) {
        audioElement.play().catch((err) => {
          console.error('Failed to play via media session:', err);
        });
      }
      onPlay?.();
    });

    mediaSession.setActionHandler('pause', () => {
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
      }
      onPause?.();
    });

    // Sync playback state with audio element
    const updatePlaybackState = () => {
      if (audioElement) {
        mediaSession.playbackState = audioElement.paused ? 'paused' : 'playing';
      }
    };

    // Listen to audio events to sync state
    if (audioElement) {
      audioElement.addEventListener('play', updatePlaybackState);
      audioElement.addEventListener('pause', updatePlaybackState);
      audioElement.addEventListener('ended', updatePlaybackState);
      updatePlaybackState(); // Set initial state
    }

    // Cleanup
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('play', updatePlaybackState);
        audioElement.removeEventListener('pause', updatePlaybackState);
        audioElement.removeEventListener('ended', updatePlaybackState);
      }
      // Clear action handlers
      try {
        mediaSession.setActionHandler('play', null);
        mediaSession.setActionHandler('pause', null);
      } catch {
        // Some browsers may not support clearing handlers
      }
    };
  }, [audioElement, onPlay, onPause]);
}
