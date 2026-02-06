"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ROUND_DURATIONS } from "@/consts/consts";
import { useAudioAmplitude } from "./useAudioAmplitude";

interface UseGameAudioOptions {
  /** Preview URL for the snippet (and full song when game over) */
  previewUrl: string | null | undefined;
  /** When true, full song can play; snippet is disabled */
  isGameOver: boolean;
  /** Current round index (for snippet duration) */
  currentRound: number;
}

/**
 * Handles all game audio: snippet playback (ROUND_DURATIONS), full song when game over,
 * mute/toggle full song. Refs are exposed so the caller can attach <audio> elements.
 */
export function useGameAudio({
  previewUrl,
  isGameOver,
  currentRound,
}: UseGameAudioOptions) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fullAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullSongPlaying, setIsFullSongPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const snippetTimeoutRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);

  const { amplitude, init: initAmplitude, start: startAmplitude, stop: stopAmplitude } =
    useAudioAmplitude(audioRef);

  const playSnippet = useCallback(() => {
  if (!audioRef.current || !previewUrl) return;
  
  // Clear any previous loops safely
  if (snippetTimeoutRef.current) {
    cancelAnimationFrame(snippetTimeoutRef.current as any);
  }
  
  const audio = audioRef.current;
  const duration = ROUND_DURATIONS[currentRound] * 1000;
  
  audio.currentTime = 0;
  initAmplitude();
  
  audio.play().then(() => {
    setIsPlaying(true);
    startAmplitude();
    
    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;

      if (elapsed >= duration) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        stopAmplitude();
        snippetTimeoutRef.current = null;
      } else {
        snippetTimeoutRef.current = requestAnimationFrame(tick);
      }
    };

    snippetTimeoutRef.current = requestAnimationFrame(tick);
  });
}, [currentRound, previewUrl, initAmplitude, startAmplitude, stopAmplitude]);

  const pauseSnippet = useCallback(() => {
    if (snippetTimeoutRef.current) {
      cancelAnimationFrame(snippetTimeoutRef.current as number);
      snippetTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    stopAmplitude();
  }, [stopAmplitude]);

  useEffect(() => {
    return () => {
      if (snippetTimeoutRef.current) clearTimeout(snippetTimeoutRef.current);
    };
  }, []);

  const toggleFullSong = useCallback(() => {
    if (!fullAudioRef.current) return;
    if (fullAudioRef.current.paused) {
      fullAudioRef.current.play().then(() => setIsFullSongPlaying(true));
    } else {
      fullAudioRef.current.pause();
      setIsFullSongPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const newMuted = !m;
      if (fullAudioRef.current) fullAudioRef.current.muted = newMuted;
      return newMuted;
    });
  }, []);

  /** Stop full song and reset state (e.g. before Play Again) */
  const stopFullSong = useCallback(() => {
    if (fullAudioRef.current) {
      fullAudioRef.current.pause();
      fullAudioRef.current.currentTime = 0;
    }
    setIsFullSongPlaying(false);
    setIsMuted(false);
  }, []);

  // When game ends, stop snippet and start full song
  useEffect(() => {
    if (!isGameOver || !previewUrl || !fullAudioRef.current) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = audioRef.current;
    const duration = ROUND_DURATIONS[currentRound] * 1000;

    audio.currentTime = 0;
    audio.play().then(() => {
      setIsPlaying(true);
      startAmplitude();

      const startTime = performance.now();

      const checkTime = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= duration) {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(false);
          stopAmplitude();
        } else {
          snippetTimeoutRef.current = requestAnimationFrame(checkTime);
        }
      };

      snippetTimeoutRef.current = requestAnimationFrame(checkTime);
    });
  }, [isGameOver, previewUrl]);

  return {
    audioRef,
    fullAudioRef,
    isPlaying,
    isFullSongPlaying,
    isMuted,
    amplitude,
    playSnippet,
    pauseSnippet,
    toggleFullSong,
    toggleMute,
    stopFullSong,
  };
}
