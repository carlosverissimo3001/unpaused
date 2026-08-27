/**
 * One AudioContext for the whole page.
 *
 * Browsers cap how many a document may hold, and each one costs real startup
 * latency, so a per-round context would reintroduce exactly the delay this
 * exists to remove.
 */
let ctx: AudioContext | null = null;

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    ctx = new Ctor();
  }
  return ctx;
}

/**
 * A context that can actually be heard, or null so the caller can fall back to
 * an audio element rather than schedule into silence.
 *
 * Autoplay policy starts the context suspended and only a user gesture can
 * resume it, so this has to be called from inside the click handler rather
 * than from an effect.
 *
 * WebKit adds a state the spec does not have: `interrupted`, which is where a
 * context lands after a phone call, a lock screen, or another app taking the
 * audio session. Checking for `suspended` alone misses it, and an interrupted
 * context accepts everything scheduled against it and plays none of it — which
 * is silence that never recovers, however many times the player taps.
 */
export async function resumeAudioContext(): Promise<AudioContext | null> {
  let context = getAudioContext();
  if (!context) {
    return null;
  }

  if (context.state !== 'running') {
    try {
      await context.resume();
    } catch {
      // Handled by the rebuild below.
    }
  }

  // resume() can resolve on an interrupted context without it ever reaching
  // running, and WebKit is known to park one there for good. A fresh context
  // is the only way back.
  if (context.state !== 'running') {
    void context.close().catch(() => {});
    ctx = null;

    context = getAudioContext();
    if (!context) {
      return null;
    }
    try {
      await context.resume();
    } catch {
      return null;
    }
  }

  return context.state === 'running' ? context : null;
}
