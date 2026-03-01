'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ROUND_DURATIONS } from '@/consts/consts';
import { useAudioAmplitude } from './useAudioAmplitude';
import { useMediaSession } from '../useMediaSession';

interface UseGameAudioOptions {
  previewUrl: string | null | undefined;
  isGameOver: boolean;
  currentRound: number;
  volume: number;
}

export function useGameAudio({
  previewUrl,
  isGameOver,
  currentRound,
  volume,
}: UseGameAudioOptions) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fullAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullSongPlaying, setIsFullSongPlaying] = useState(false);

  // Use a Ref to track the animation frame for high-precision stopping
  const requestRef = useRef<number | null>(null);
  // Track if hardware is "warmed up" (mobile specific)
  const isWarmedUp = useRef(false);

  const {
    amplitude,
    init: initAmplitude,
    start: startAmplitude,
    stop: stopAmplitude,
  } = useAudioAmplitude(audioRef);

  // Keep a ref so imperative play calls always read the latest volume
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Apply volume to both audio elements whenever it changes (live adjustment)
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (fullAudioRef.current) fullAudioRef.current.volume = volume;
  }, [volume]);

  const stopAudioInternal = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    stopAmplitude();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [stopAmplitude]);

  const playSnippet = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;

    // 1. Mobile "Warm-up" / Playback unlock
    // We play and immediately continue our logic to ensure the OS
    // doesn't suppress the short snippet.
    if (!isWarmedUp.current) {
      audio.play().catch(() => {});
      isWarmedUp.current = true;
    }

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const durationMs = ROUND_DURATIONS[currentRound] * 1000 + 100;

    // Add a tiny buffer for mobile (iOS fade-in compensation)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const adjustedDuration = isMobile ? durationMs + 60 : durationMs;

    audio.currentTime = 0;
    audio.volume = volumeRef.current;
    initAmplitude();

    audio
      .play()
      .then(() => {
        startAmplitude();
        setIsPlaying(true);

        const startTime = performance.now();

        const checkTime = () => {
          const now = performance.now();
          const elapsed = now - startTime;

          if (elapsed >= adjustedDuration) {
            stopAudioInternal();
          } else {
            requestRef.current = requestAnimationFrame(checkTime);
          }
        };

        requestRef.current = requestAnimationFrame(checkTime);
      })
      .catch(console.error);
  }, [
    currentRound,
    previewUrl,
    initAmplitude,
    startAmplitude,
    stopAudioInternal,
  ]);

  const pauseSnippet = useCallback(() => {
    stopAudioInternal();
  }, [stopAudioInternal]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const toggleFullSong = useCallback(() => {
    if (!fullAudioRef.current) return;

    if (fullAudioRef.current.paused) {
      fullAudioRef.current.volume = volumeRef.current;
      void fullAudioRef.current.play().then(() => setIsFullSongPlaying(true));
    } else {
      fullAudioRef.current.pause();
      setIsFullSongPlaying(false);
    }
  }, []);

  const stopFullSong = useCallback(() => {
    if (fullAudioRef.current) {
      fullAudioRef.current.pause();
      fullAudioRef.current.currentTime = 0;
    }
    setIsFullSongPlaying(false);
  }, []);

  // Intercept OS media keys so hardware play/pause can't bypass snippet timing
  const mediaSessionCallbacks = useMemo(
    () =>
      isGameOver
        ? { onPlay: toggleFullSong, onPause: toggleFullSong }
        : { onPlay: playSnippet, onPause: pauseSnippet },
    [isGameOver, toggleFullSong, playSnippet, pauseSnippet],
  );

  useMediaSession({
    enabled: !!previewUrl,
    ...mediaSessionCallbacks,
  });

  useEffect(() => {
    if (!isGameOver || !previewUrl) return;

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 2. Start the full song
    const fullAudio = fullAudioRef.current;
    if (fullAudio) {
      fullAudio.currentTime = 0;
      fullAudio.volume = volumeRef.current;
      fullAudio
        .play()
        .then(() => setIsFullSongPlaying(true))
        .catch(() => {
          /* Autoplay block */
        });
    }

    setTimeout(() => setIsPlaying(false), 0);
  }, [isGameOver, previewUrl]);

  return {
    audioRef,
    fullAudioRef,
    isPlaying,
    isFullSongPlaying,
    amplitude,
    playSnippet,
    pauseSnippet,
    toggleFullSong,
    stopFullSong,
  };
}
