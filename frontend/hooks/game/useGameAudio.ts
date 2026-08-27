'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaSession } from '../useMediaSession';
import { useSnippetAudio } from './useSnippetAudio';

interface UseGameAudioOptions {
  previewUrl: string | null | undefined;
  isGameOver: boolean;
  snippetDuration: number;
  /** The longest snippet any round reaches, so the player knows what is used. */
  maxSnippetDuration?: number;
  volume: number;
}

/** readyState: enough decoded to play the current position. */
const HAVE_CURRENT_DATA = 2;

export function useGameAudio({
  previewUrl,
  isGameOver,
  snippetDuration,
  maxSnippetDuration = 12,
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
    window: maxSnippetDuration,
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

    // Only the fallback path plays this element, and only that path pays the
    // startup cost this hides. Warming it up when snippets come from Web Audio
    // is worse than useless on iOS: volume is read-only there, so the "silent"
    // warmup is audible, and starting an element can interrupt the very
    // AudioContext the snippets need.
    //
    // Waiting on the decode too, not just its result: the element and the
    // decoder race, and warming up because the decoder has not answered yet
    // is how this fires on a device that was never going to need it.
    if (snippet.status !== 'failed') {
      isWarmedUp.current = snippet.isReady;
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
  }, [previewUrl, snippet.isReady, snippet.status]);

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

  // Which path a track ended up on is the first thing worth knowing when
  // sound misbehaves on a device that cannot be attached to a debugger.
  const loggedPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !previewUrl) return;
    // Only once the decode has answered.
    if (snippet.status !== 'ready' && snippet.status !== 'failed') return;
    if (loggedPathRef.current === previewUrl) return;
    loggedPathRef.current = previewUrl;
    console.log(
      `[useGameAudio] snippets via ${
        snippet.status === 'ready' ? 'web-audio' : 'audio-element (fallback)'
      }`,
    );
  }, [previewUrl, snippet.status]);

  /**
   * The fallback. Kept callable on its own because Web Audio can refuse at the
   * moment of playing -- an interrupted session on iOS being the reason -- and
   * a tap that quietly does nothing is worse than one that sounds late.
   */
  const playViaElement = useCallback(() => {
    const audio = audioRef.current;
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
  }, [snippetDuration, stopAudioInternal]);

  const playSnippet = useCallback(() => {
    if (!previewUrl) return;

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // Preferred path: decoded audio, so this starts on the next audio callback
    // rather than after the element spins up, and lasts exactly as long as
    // asked.
    if (snippet.isReady) {
      void snippet.play(snippetDuration).then((started) => {
        if (started) {
          setIsPlaying(true);
          return;
        }
        // The context could not be made to run -- on iOS it can be parked at
        // `interrupted` for good. The element is unaffected by that, so the
        // tap still produces sound.
        playViaElement();
      });
      return;
    }

    playViaElement();
  }, [snippetDuration, previewUrl, snippet, playViaElement]);

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
      // No setState here: the element's own play event is what flips the icon,
      // so it cannot claim to be playing something nobody can hear.
      void fullAudioRef.current.play().catch(() => {});
    } else {
      fullAudioRef.current.pause();
    }
  }, []);

  const stopFullSong = useCallback(() => {
    if (fullAudioRef.current) {
      fullAudioRef.current.pause();
      fullAudioRef.current.currentTime = 0;
    }
    setIsFullSongPlaying(false);
  }, []);

  /**
   * The reveal button reflects the element rather than what we asked it to do.
   * A play() that resolves is not the same as audio anybody can hear, and an
   * icon that says otherwise is worse than one that says nothing.
   */
  useEffect(() => {
    const fullAudio = fullAudioRef.current;
    if (!fullAudio) return;

    const onPlaying = () => setIsFullSongPlaying(true);
    const onStopped = () => setIsFullSongPlaying(false);

    fullAudio.addEventListener('playing', onPlaying);
    fullAudio.addEventListener('pause', onStopped);
    fullAudio.addEventListener('ended', onStopped);
    fullAudio.addEventListener('emptied', onStopped);

    return () => {
      fullAudio.removeEventListener('playing', onPlaying);
      fullAudio.removeEventListener('pause', onStopped);
      fullAudio.removeEventListener('ended', onStopped);
      fullAudio.removeEventListener('emptied', onStopped);
    };
  }, [isGameOver, previewUrl]);

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

  /**
   * Which preview the reveal has actually played, so a re-minted link does not
   * replay it mid transition to the next round.
   *
   * Marked when playback starts rather than when it is asked for: a guard set
   * up front survives the cleanup that removes the listener it was waiting on,
   * so under Strict Mode the second pass bails and nothing ever plays.
   */
  const revealPlayedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isGameOver) {
      revealPlayedForRef.current = null;
    }
  }, [isGameOver]);

  useEffect(() => {
    if (!isGameOver || !previewUrl) return;
    if (revealPlayedForRef.current === previewUrl) return;

    let cleanupReveal: (() => void) | undefined;

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
      fullAudio.volume = volumeRef.current;

      const start = () => {
        revealPlayedForRef.current = previewUrl;
        fullAudio.currentTime = 0;
        // Nothing sets the icon here either; the element's play event does.
        void fullAudio.play().catch(() => {
          /* Autoplay block on game-over auto-play — user can tap manually */
        });
      };

      // The element mounts in the same commit that ends the round, so its src
      // has not begun loading. Playing an element with nothing in it starts
      // nominally and is then reset the moment the source arrives, which is
      // silence with a pause icon over it.
      if (fullAudio.readyState >= HAVE_CURRENT_DATA) {
        start();
      } else {
        fullAudio.addEventListener('canplay', start, { once: true });
        cleanupReveal = () => fullAudio.removeEventListener('canplay', start);
      }
    }

    setTimeout(() => setIsPlaying(false), 0);
    return () => cleanupReveal?.();
  }, [isGameOver, previewUrl]);

  return {
    audioRef,
    fullAudioRef,
    /** 0–1 through the current snippet, for the progress bar. */
    snippetProgress: snippet.progress,
    /** Peaks of the decoded track, for the waveform. */
    snippetPeaks: snippet.peaks,
    isPlaying,
    isFullSongPlaying,
    playSnippet,
    pauseSnippet,
    toggleFullSong,
    stopFullSong,
  };
}
