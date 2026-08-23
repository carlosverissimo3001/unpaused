'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaSession } from '../useMediaSession';
import { useSnippetAudio } from './useSnippetAudio';

interface UseGameAudioOptions {
  previewUrl: string | null | undefined;
  isGameOver: boolean;
  snippetDuration: number;
  volume: number;
}

export function useGameAudio({
  previewUrl,
  isGameOver,
  snippetDuration,
  volume,
}: UseGameAudioOptions) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fullAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullSongPlaying, setIsFullSongPlaying] = useState(false);

  const requestRef = useRef<number | null>(null);

  const handleSnippetEnded = useCallback(() => setIsPlaying(false), []);
  const snippet = useSnippetAudio({
    previewUrl,
    volume,
    onEnded: handleSnippetEnded,
  });

  // True once the iOS audio hardware session has been initialized.
  // Reset on each new track and whenever the audio session may have been
  // interrupted (tab hidden, incoming call, etc.).
  const isWarmedUp = useRef(false);

  // Set to true when the user taps play while background warmup is still
  // running, so the warmup setTimeout knows to bail instead of conflicting.
  const warmupAbortRef = useRef(false);

  // Monotonically increasing ID — only the latest playSnippet call may start
  // playback; prevents stale callbacks from queued rapid taps.
  const playRequestIdRef = useRef(0);

  // Separate timer refs for background vs inline warmup so they never
  // clobber each other's handles.
  const bgWarmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inlineWarmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) audioRef.current.volume = volume;
    if (fullAudioRef.current) fullAudioRef.current.volume = volume;
  }, [volume]);

  // ─── Reset warmup whenever the track changes (new game) ───────────────────
  // The iOS audio session is scoped to the current playback context. When the
  // src changes, the old warmup is invalidated. Cancel any in-flight warmup
  // timer so its callback cannot set isWarmedUp for the new track.
  useEffect(() => {
    if (bgWarmupTimerRef.current !== null) {
      clearTimeout(bgWarmupTimerRef.current);
      bgWarmupTimerRef.current = null;
    }
    if (inlineWarmupTimerRef.current !== null) {
      clearTimeout(inlineWarmupTimerRef.current);
      inlineWarmupTimerRef.current = null;
    }
    isWarmedUp.current = false;
    warmupAbortRef.current = false;
  }, [previewUrl]);

  // ─── Reset warmup when the tab regains visibility ─────────────────────────
  // iOS interrupts the audio session when the user backgrounds the app,
  // locks the screen, or takes a phone call. visibilitychange is the most
  // reliable cross-browser signal for this.
  useEffect(() => {
    if (!(navigator.maxTouchPoints > 0)) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        isWarmedUp.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ─── Background warmup ────────────────────────────────────────────────────
  // On mobile, silently play+pause the audio element as soon as it has data.
  // This initialises the OS audio session so the first user-tapped snippet
  // plays immediately instead of being swallowed by the ~200ms session startup.
  // We rely on autoplay policy allowing a low-volume play here; if it's
  // blocked the user's tap will trigger an inline warmup instead.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;

    const isMobile = navigator.maxTouchPoints > 0;
    if (!isMobile) {
      isWarmedUp.current = true;
      return;
    }

    const runWarmup = () => {
      // Bail if the user already tapped (inline warmup will handle it) or if
      // the warmup was already completed for this track.
      if (isWarmedUp.current || warmupAbortRef.current) return;

      audio.volume = 0;
      audio.currentTime = 0;

      audio
        .play()
        .then(() => {
          bgWarmupTimerRef.current = setTimeout(() => {
            bgWarmupTimerRef.current = null;
            if (warmupAbortRef.current) {
              // User tapped while we were warming up — they already handled it.
              warmupAbortRef.current = false;
              return;
            }
            audio.pause();
            audio.currentTime = 0;
            audio.volume = volumeRef.current;
            isWarmedUp.current = true;
          }, 150);
        })
        .catch(() => {
          // Autoplay blocked — warmup will happen inline on first tap instead.
          audio.volume = volumeRef.current;
          audio.currentTime = 0;
        });
    };

    if (audio.readyState >= 3) {
      runWarmup();
    } else {
      audio.addEventListener('canplaythrough', runWarmup, { once: true });
      return () => audio.removeEventListener('canplaythrough', runWarmup);
    }
  }, [previewUrl]);

  // Held in a ref so stopAudioInternal keeps a stable identity — it is a
  // dependency of half the callbacks in here.
  const snippetStopRef = useRef(snippet.stop);
  useEffect(() => {
    snippetStopRef.current = snippet.stop;
  }, [snippet.stop]);

  const stopAudioInternal = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    // Cancel any pending warmup timer and invalidate its startPlayback callback.
    if (bgWarmupTimerRef.current !== null) {
      clearTimeout(bgWarmupTimerRef.current);
      bgWarmupTimerRef.current = null;
    }
    if (inlineWarmupTimerRef.current !== null) {
      clearTimeout(inlineWarmupTimerRef.current);
      inlineWarmupTimerRef.current = null;
    }
    // Bump the request ID so any in-flight startPlayback() call becomes stale.
    ++playRequestIdRef.current;
    snippetStopRef.current();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const playSnippet = useCallback(() => {
    const audio = audioRef.current;
    if (!previewUrl) return;

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // Preferred path: decoded audio, so this starts on the next audio callback
    // rather than after the element spins up, and lasts exactly as long as
    // asked. Everything below only runs when decoding was unavailable.
    if (snippet.isReady) {
      void snippet.play(snippetDuration).then((started) => {
        if (started) {
          setIsPlaying(true);
        }
      });
      return;
    }

    if (!audio) return;

    const isMobile = navigator.maxTouchPoints > 0;
    const durationMs = snippetDuration * 1000 + 100;
    // Add a small buffer on mobile to compensate for iOS fade-in latency.
    const adjustedDuration = isMobile ? durationMs + 60 : durationMs;
    const requestId = ++playRequestIdRef.current;

    const startPlayback = () => {
      if (requestId !== playRequestIdRef.current) return;

      audio.currentTime = 0;
      audio.volume = volumeRef.current;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);

          const startTime = performance.now();
          const checkTime = () => {
            if (performance.now() - startTime >= adjustedDuration) {
              stopAudioInternal();
            } else {
              requestRef.current = requestAnimationFrame(checkTime);
            }
          };
          requestRef.current = requestAnimationFrame(checkTime);
        })
        .catch((err: unknown) => {
          console.warn('[useGameAudio] play() rejected:', err);
          setIsPlaying(false);
        });
    };

    if (!isWarmedUp.current && isMobile) {
      // Background warmup didn't complete (autoplay blocked, or still running).
      // Signal any in-progress warmup to abort, then do an inline warmup under
      // this user gesture. We wait 150ms — the same window the background
      // warmup uses — to let iOS fully initialise the audio hardware session
      // before starting real playback.
      warmupAbortRef.current = true;

      audio.volume = 0;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          inlineWarmupTimerRef.current = setTimeout(() => {
            inlineWarmupTimerRef.current = null;
            if (requestId !== playRequestIdRef.current) {
              // A newer tap arrived during the warmup window — bail out cleanly.
              audio.pause();
              audio.currentTime = 0;
              audio.volume = volumeRef.current;
              return;
            }
            audio.pause();
            audio.currentTime = 0;
            isWarmedUp.current = true;
            warmupAbortRef.current = false;
            startPlayback();
          }, 150);
        })
        .catch(() => {
          // play() failed even under user gesture — skip warmup and try direct.
          isWarmedUp.current = true;
          warmupAbortRef.current = false;
          startPlayback();
        });
    } else {
      startPlayback();
    }
  }, [snippetDuration, previewUrl, stopAudioInternal, snippet]);

  const pauseSnippet = useCallback(() => {
    stopAudioInternal();
  }, [stopAudioInternal]);

  // Clean up RAF and any pending warmup timers on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (bgWarmupTimerRef.current !== null)
        clearTimeout(bgWarmupTimerRef.current);
      if (inlineWarmupTimerRef.current !== null)
        clearTimeout(inlineWarmupTimerRef.current);
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

    const fullAudio = fullAudioRef.current;
    if (fullAudio) {
      fullAudio.currentTime = 0;
      fullAudio.volume = volumeRef.current;
      fullAudio
        .play()
        .then(() => setIsFullSongPlaying(true))
        .catch(() => {
          /* Autoplay block on game-over auto-play — user can tap manually */
        });
    }

    setTimeout(() => setIsPlaying(false), 0);
  }, [isGameOver, previewUrl]);

  return {
    audioRef,
    fullAudioRef,
    isPlaying,
    isFullSongPlaying,
    playSnippet,
    pauseSnippet,
    toggleFullSong,
    stopFullSong,
  };
}
