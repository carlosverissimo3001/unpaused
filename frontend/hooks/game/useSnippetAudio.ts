'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { SnippetPlayer } from '@/lib/snippet-player';

/**
 * Enough bars to read as a waveform at the widths we render, few enough that
 * the DOM stays cheap.
 */
const WAVEFORM_SLICES = 96;

interface UseSnippetAudioOptions {
  previewUrl: string | null | undefined;
  volume: number;
  /** The longest snippet a round can reach. Audio past it is never heard. */
  window: number;
  onEnded: () => void;
}

/**
 * React wrapper around SnippetPlayer. The playback mechanics live in the class
 * so they can be tested without a DOM; this only owns the lifecycle.
 */
export function useSnippetAudio({
  previewUrl,
  volume,
  window,
  onEnded,
}: UseSnippetAudioOptions) {
  const playerRef = useRef<SnippetPlayer | null>(null);
  if (playerRef.current === null) {
    playerRef.current = new SnippetPlayer(undefined, window);
  }
  const player = playerRef.current;

  const [isReady, setIsReady] = useState(false);
  /** Peaks of the decoded track, for drawing the waveform. */
  const [peaks, setPeaks] = useState<number[]>([]);
  /**
   * A MotionValue rather than state: the playhead updates every frame, and
   * re-rendering the game sixty times a second to move a bar is not worth it.
   */
  const progress = useMotionValue(0);
  const frameRef = useRef<number | null>(null);

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
    setPeaks([]);
    if (!previewUrl) {
      player.unload();
      return;
    }

    let cancelled = false;
    void player.load(previewUrl).then((loaded) => {
      if (!cancelled) {
        setIsReady(loaded);
        setPeaks(loaded ? player.peaks(WAVEFORM_SLICES) : []);
      }
    });

    return () => {
      cancelled = true;
      player.stop();
    };
  }, [player, previewUrl]);

  useEffect(() => () => player.unload(), [player]);

  const stopTracking = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const play = useCallback(
    async (durationSeconds: number) => {
      const started = await player.play(durationSeconds);
      if (!started) {
        return false;
      }
      stopTracking();
      const follow = () => {
        const value = player.progress();
        progress.set(value);
        // progress() returns 0 once the source is gone, which is also the
        // resting state, so the loop ends rather than pinning the bar at full.
        if (value > 0 && value < 1) {
          frameRef.current = requestAnimationFrame(follow);
        } else {
          frameRef.current = null;
        }
      };
      frameRef.current = requestAnimationFrame(follow);
      return true;
    },
    [player, progress, stopTracking],
  );

  const stop = useCallback(() => {
    stopTracking();
    progress.set(0);
    player.stop();
  }, [player, progress, stopTracking]);

  useEffect(() => stopTracking, [stopTracking]);

  return { play, stop, isReady, progress, peaks };
}
