/**
 * One AudioContext for the whole page.
 *
 * Browsers cap how many a document may hold, and each one costs real startup
 * latency, so a per-round context would reintroduce exactly the delay this
 * exists to remove.
 */
let ctx: AudioContext | null = null;

/**
 * Whether the hardware has actually been started for this context.
 *
 * `running` is not the same as ready: the clock does not advance until
 * something has been played, so the first source scheduled against a freshly
 * resumed context can be dropped and its `ended` never arrive. A one-sample
 * silent buffer is the long-standing way to start it.
 */
let unlocked = false;

/** How long to let a resume settle before treating the context as unusable. */
const RESUME_GRACE_MS = 400;

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
    unlocked = false;
  }
  return ctx;
}

/**
 * Has to run inside the gesture, like the resume it follows. Silent, so there
 * is nothing to hear, and one sample long, so there is nothing to wait for.
 */
function unlock(context: AudioContext): void {
  if (unlocked) {
    return;
  }
  try {
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, 22050);
    source.connect(context.destination);
    source.start(0);
    unlocked = true;
  } catch {
    // Left locked, so the next gesture tries again.
  }
}

/**
 * `resume()` resolving does not mean the state has caught up — Chrome flips it
 * a beat later. Sampling once and acting on the answer throws away contexts
 * that were about to work perfectly well.
 */
function waitForRunning(context: AudioContext): Promise<boolean> {
  if (context.state === 'running') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      context.removeEventListener('statechange', onChange);
      clearTimeout(timer);
      resolve(value);
    };

    const onChange = () => {
      if (context.state === 'running') {
        finish(true);
      }
    };

    const timer = setTimeout(() => finish(false), RESUME_GRACE_MS);
    context.addEventListener('statechange', onChange);
  });
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
      // Handled by the wait and rebuild below.
    }
  }

  if (await waitForRunning(context)) {
    unlock(context);
    return context;
  }

  // Only now: it was asked to resume, given time to, and never got there.
  // WebKit is known to park a context at `interrupted` for good, and a fresh
  // one is the only way back.
  void context.close().catch(() => {});
  ctx = null;
  unlocked = false;

  context = getAudioContext();
  if (!context) {
    return null;
  }
  try {
    await context.resume();
  } catch {
    return null;
  }

  if (!(await waitForRunning(context))) {
    return null;
  }

  unlock(context);
  return context;
}
