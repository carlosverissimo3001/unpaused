"use client";

import { useRef, useCallback, useEffect } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

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
  audioRef: React.RefObject<HTMLAudioElement | null>
): UseAudioAmplitudeReturn {
  const amplitude = useMotionValue(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const init = useCallback(() => {
    if (ctxRef.current) return; // already initialised
    if (!audioRef.current) return;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    dataRef.current = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>;
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
    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, []);

  return { amplitude, init, start, stop };
}
