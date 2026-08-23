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
 * Autoplay policy starts the context suspended, and only a user gesture can
 * resume it — so this has to be called from inside the click handler, not from
 * an effect.
 */
export async function resumeAudioContext(): Promise<AudioContext | null> {
  const context = getAudioContext();
  if (!context) {
    return null;
  }
  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return null;
    }
  }
  return context;
}
