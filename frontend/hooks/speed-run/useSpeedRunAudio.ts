'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useGameAudio } from '@/hooks/game/useGameAudio';

interface UseGauntletAudioOptions {
  previewUrl: string | null | undefined;
  snippetDuration: number;
  volume: number;
  runEnded: boolean;
}

/**
 * Audio hook for gauntlet mode. Adapts useGameAudio for single-snippet play with
 * auto-advance: after the first manual play, new tracks auto-play after ~900ms.
 */
export function useGauntletAudio({
  previewUrl,
  snippetDuration,
  volume,
  runEnded,
}: UseGauntletAudioOptions) {
  const hasPlayedOnceRef = useRef(false);
  const prevPreviewUrlRef = useRef<string | null>(null);

  // isGameOver=false: never trigger the "play full song" behavior from useGameAudio
  const audio = useGameAudio({
    previewUrl,
    isGameOver: false,
    snippetDuration,
    volume,
  });

  const { playSnippet } = audio;

  // Wrap playSnippet to track that the user has manually played at least once
  const playSnippetWithTracking = useCallback(() => {
    hasPlayedOnceRef.current = true;
    playSnippet();
  }, [playSnippet]);

  // Auto-play when a new previewUrl arrives (correct guess → next track)
  useEffect(() => {
    if (!previewUrl || previewUrl === prevPreviewUrlRef.current || runEnded)
      return;
    prevPreviewUrlRef.current = previewUrl;

    if (!hasPlayedOnceRef.current) return; // First track: wait for manual play

    const timer = setTimeout(() => {
      playSnippet();
    }, 150);

    return () => clearTimeout(timer);
  }, [previewUrl, runEnded, playSnippet]);

  return {
    ...audio,
    playSnippet: playSnippetWithTracking,
  };
}
