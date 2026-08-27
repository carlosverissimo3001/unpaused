/**
 * One AudioContext for the whole page.
 *
 * Browsers cap how many a document may hold, and each one costs real startup
 * latency, so a per-round context would reintroduce exactly the delay this
 * exists to remove.
 */
let ctx: AudioContext | null = null;

/** A resumed context's clock does not advance until something has played. */
let unlocked = false;

/** How long to let a resume settle before treating the context as unusable. */
const RESUME_GRACE_MS = 400;

/** How long to wait for the hardware to start before scheduling anyway. */
const CLOCK_START_TIMEOUT_MS = 250;

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
 * iOS does not start the clock until playback has actually begun, so a source
 * scheduled straight after a resume can land entirely inside the hardware's
 * startup — which is the whole of a 0.1s first round.
 */
function waitForClock(context: AudioContext): Promise<void> {
  const started = context.currentTime;
  if (started > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + CLOCK_START_TIMEOUT_MS;
    const check = () => {
      if (context.currentTime > started || Date.now() > deadline) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

/** Silent and one sample long; has to run inside the gesture. */
async function unlock(context: AudioContext): Promise<void> {
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
    return;
  }

  await waitForClock(context);
}

/** Chrome flips the state a beat after resume() resolves. */
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
 * A context that can be heard, or null so the caller can fall back. Must run
 * inside the gesture. WebKit adds `interrupted`, where a context accepts
 * everything scheduled against it and plays none of it.
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

  if (await waitForRunning(context)) {
    await unlock(context);
    return context;
  }

  // Asked, waited for, still not running: WebKit parks one here for good.
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

  await unlock(context);
  return context;
}
