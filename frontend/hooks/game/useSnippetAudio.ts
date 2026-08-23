'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SnippetPlayer } from '@/lib/snippet-player';

interface UseSnippetAudioOptions {
  previewUrl: string | null | undefined;
  volume: number;
  onEnded: () => void;
}

/**
 * React wrapper around SnippetPlayer. The playback mechanics live in the class
 * so they can be tested without a DOM; this only owns the lifecycle.
 */
export function useSnippetAudio({
  previewUrl,
  volume,
  onEnded,
}: UseSnippetAudioOptions) {
  const playerRef = useRef<SnippetPlayer | null>(null);
  if (playerRef.current === null) {
    playerRef.current = new SnippetPlayer();
  }
  const player = playerRef.current;

  const [isReady, setIsReady] = useState(false);

  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    player.onEnded = () => onEndedRef.current();
    return () => {
      player.onEnded = null;
    };
  }, [player]);

  useEffect(() => {
    player.setVolume(volume);
  }, [player, volume]);

  // Decoded during round load, so the first press has nothing to wait for.
  useEffect(() => {
    setIsReady(false);
    if (!previewUrl) {
      player.unload();
      return;
    }

    let cancelled = false;
    void player.load(previewUrl).then((loaded) => {
      if (!cancelled) {
        setIsReady(loaded);
      }
    });

    return () => {
      cancelled = true;
      player.stop();
    };
  }, [player, previewUrl]);

  useEffect(() => () => player.unload(), [player]);

  const play = useCallback(
    (durationSeconds: number) => player.play(durationSeconds),
    [player],
  );
  const stop = useCallback(() => player.stop(), [player]);

  return { play, stop, isReady };
}
