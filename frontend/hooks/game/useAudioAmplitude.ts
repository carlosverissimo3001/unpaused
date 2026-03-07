'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';

interface UseAudioAmplitudeReturn {
  amplitude: MotionValue<number>;
  init: () => void;
  start: () => void;
  stop: () => void;
}

/**
 * Tracks real-time audio amplitude via Web Audio API AnalyserNode.
 * Returns a MotionValue<number> (0–1) that updates every animation frame
 * without causing React re-renders.
 */
export function useAudioAmplitude(
  audioRef: React.RefObject<HTMLAudioElement | null>,
): UseAudioAmplitudeReturn {
  const amplitude = useMotionValue(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  // Track which element is connected so we never call createMediaElementSource twice on it.
  // The browser permanently "claims" an element on first connection — re-connecting it to a
  // new AudioContext (even after the old one is closed) throws an InvalidStateError.
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);

  const init = useCallback(() => {
    if (!audioRef.current) return;
    const el = audioRef.current;

    // Same element, context already wired up — just resume if suspended and bail
    if (ctxRef.current && connectedElementRef.current === el) {
      if (ctxRef.current.state === 'suspended') {
        void ctxRef.current.resume();
      }
      return;
    }

    // Element changed (e.g. Play Again swap) — close the stale context so we can
    // wire up the new element. This is safe because the old element is gone.
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const source = ctx.createMediaElementSource(el);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    connectedElementRef.current = el;
    dataRef.current = new Uint8Array(
      analyser.fftSize,
    ) as Uint8Array<ArrayBuffer>;
  }, [audioRef]);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getByteTimeDomainData(data);

    // Peak deviation from 128 (silence center) → normalised 0–1
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const deviation = Math.abs(data[i] - 128);
      if (deviation > peak) peak = deviation;
    }
    amplitude.set(peak / 128);

    // eslint-disable-next-line react-hooks/immutability -- Callback is fully defined before it's called
    rafRef.current = requestAnimationFrame(tick);
  }, [amplitude]);

  const start = useCallback(() => {
    if (rafRef.current !== null) return; // already running
    if (ctxRef.current?.state === 'suspended') {
      void ctxRef.current.resume();
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    amplitude.set(0);
  }, [amplitude]);

  // Cleanup on unmount: suspend rather than close the AudioContext.
  // Closing it would permanently disconnect the element — if React Strict Mode
  // (or any future remount) calls init() again for the same element, the browser
  // would refuse to create a second MediaElementSourceNode for it and throw.
  // Suspension is reversible; the context (and element claim) persist until the
  // hook instance itself is GC'd after true unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (ctxRef.current?.state === 'running') {
        void ctxRef.current.suspend();
      }
    };
  }, []);

  return { amplitude, init, start, stop };
}
