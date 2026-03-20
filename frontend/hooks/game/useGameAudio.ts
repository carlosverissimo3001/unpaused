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
  // Track if audio pipeline is warmed up (mobile specific)
  const isWarmedUp = useRef(false);
  const warmupPromiseRef = useRef<Promise<void> | null>(null);
  // Monotonically increasing ID so only the latest playSnippet call can start playback
  const playRequestIdRef = useRef(0);

  const {
    amplitude,
    init: initAmplitude,
    start: startAmplitude,
    stop: stopAmplitude,
  } = useAudioAmplitude(audioRef);

  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) audioRef.current.volume = volume;
    if (fullAudioRef.current) fullAudioRef.current.volume = volume;
  }, [volume]);

  // Pre-warm the audio pipeline on mobile once the audio element has data.
  // This silently plays and pauses the audio so the OS audio session is
  // initialized before the user clicks play, eliminating the ~200ms warmup
  // delay that swallows short snippets (0.1s, 0.5s).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl || isWarmedUp.current) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      isWarmedUp.current = true;
      return;
    }

    const handleCanPlay = () => {
      if (isWarmedUp.current) return;

      audio.volume = 0;
      audio.currentTime = 0;

      warmupPromiseRef.current = audio
        .play()
        .then(() => {
          // Let the audio session fully initialize, then pause
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
              // Use volumeRef.current so a volume change during warmup isn't overwritten
              audio.volume = volumeRef.current;
              isWarmedUp.current = true;
              warmupPromiseRef.current = null;
              resolve();
            }, 150);
          });
        })
        .catch(() => {
          // Autoplay blocked — restore state; will warm up on first user-initiated play
          audio.volume = volumeRef.current;
          audio.currentTime = 0;
          warmupPromiseRef.current = null;
        });
    };

    if (audio.readyState >= 3) {
      handleCanPlay();
    } else {
      audio.addEventListener('canplaythrough', handleCanPlay, { once: true });
      return () => audio.removeEventListener('canplaythrough', handleCanPlay);
    }
  }, [previewUrl]);

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

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const durationMs = ROUND_DURATIONS[currentRound] * 1000 + 100;

    // Add a tiny buffer for mobile (iOS fade-in compensation)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const adjustedDuration = isMobile ? durationMs + 60 : durationMs;

    // Stamp this call — if a newer call arrives before we start, we bail out.
    // This prevents rapid taps from queueing multiple startPlayback callbacks.
    const requestId = ++playRequestIdRef.current;

    const startPlayback = () => {
      if (requestId !== playRequestIdRef.current) return;

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
    };

    if (!isWarmedUp.current && isMobile && !warmupPromiseRef.current) {
      // Warmup never ran (autoplay blocked) — do inline warmup under this user gesture
      audio.volume = 0;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          isWarmedUp.current = true;
          startPlayback();
        })
        .catch(() => {
          // Fallback: just try to play directly
          startPlayback();
        });
    } else {
      // Either warmed up, or warmup is in progress (audio session already initializing).
      // Call startPlayback immediately to preserve the iOS user-gesture context —
      // deferring via .then() can lose it and cause playback to be blocked.
      startPlayback();
    }
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
