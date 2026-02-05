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

  const snippetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { amplitude, init: initAmplitude, start: startAmplitude, stop: stopAmplitude } =
    useAudioAmplitude(audioRef);

  const playSnippet = useCallback(() => {
    if (!audioRef.current || !previewUrl) return;
    if (snippetTimeoutRef.current) clearTimeout(snippetTimeoutRef.current);
    const duration = ROUND_DURATIONS[currentRound] * 1000;
    audioRef.current.currentTime = 0;
    initAmplitude();
    audioRef.current.play();
    startAmplitude();
    setIsPlaying(true);
    snippetTimeoutRef.current = setTimeout(() => {
      snippetTimeoutRef.current = null;
      stopAmplitude();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }, duration);
  }, [currentRound, previewUrl, initAmplitude, startAmplitude, stopAmplitude]);

  const pauseSnippet = useCallback(() => {
    if (snippetTimeoutRef.current) clearTimeout(snippetTimeoutRef.current);
    snippetTimeoutRef.current = null;
    stopAmplitude();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
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
    const audio = fullAudioRef.current;
    audio.currentTime = 0;
    audio.play().then(() => setIsFullSongPlaying(true)).catch(() => {
      // Browser may block autoplay — user can click play manually
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
