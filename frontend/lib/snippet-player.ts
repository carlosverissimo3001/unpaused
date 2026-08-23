import { getAudioContext, resumeAudioContext } from './audio-context';

/**
 * Plays short snippets through Web Audio rather than an <audio> element.
 *
 * An element cannot do this. `play()` has to seek, decode and spin up the OS
 * audio session first — 100–300ms, and worse on a cold first play — so a 0.1s
 * snippet is over before any sound arrives. Stopping it needs a JS timer, which
 * drifts, so the same round comes out a different length each time.
 *
 * Decoding up front moves that cost to round load, where nobody notices it, and
 * `start(when, offset, duration)` is scheduled on the audio clock, so playback
 * begins immediately and lasts exactly as long as asked.
 *
 * It also sidesteps preview URLs expiring: Deezer signs them with a ~15 minute
 * window, but once decoded the audio is a buffer in memory and the URL is no
 * longer needed.
 *
 * Kept free of React so it can be tested without a DOM.
 */
interface AudioAccess {
  /** For decoding, which needs no user gesture. */
  get(): AudioContext | null;
  /** For playback, which does. */
  resume(): Promise<AudioContext | null>;
}

const sharedAudio: AudioAccess = {
  get: getAudioContext,
  resume: resumeAudioContext,
};

export class SnippetPlayer {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private volume = 1;
  /** Guards against a slow decode landing after the track has moved on. */
  private generation = 0;
  /** Context clock reading when the current snippet started, for the playhead. */
  private startedAt = 0;
  private playingFor = 0;

  onEnded: (() => void) | null = null;

  // Injected so tests can drive it without a DOM, and so the shared context is
  // an argument rather than a hidden import.
  constructor(private readonly audio: AudioAccess = sharedAudio) {}

  get isReady(): boolean {
    return this.buffer !== null;
  }

  /**
   * Peak amplitude across `count` equal slices of the track, each 0–1.
   *
   * Drawn from the buffer already decoded for playback, so a waveform of the
   * real song costs no network and no second decode. Returns an empty array
   * before anything is loaded.
   */
  peaks(count: number): number[] {
    const buffer = this.buffer;
    if (!buffer || count <= 0) {
      return [];
    }

    // One channel is enough: the two are near-identical at this resolution,
    // and averaging them would cost a second pass over ~1.3M samples.
    const samples = buffer.getChannelData(0);
    const per = Math.floor(samples.length / count) || 1;
    const out: number[] = new Array<number>(count);

    let ceiling = 0;
    for (let slice = 0; slice < count; slice++) {
      const start = slice * per;
      const end = Math.min(start + per, samples.length);
      let peak = 0;
      for (let i = start; i < end; i++) {
        const value = samples[i] < 0 ? -samples[i] : samples[i];
        if (value > peak) {
          peak = value;
        }
      }
      out[slice] = peak;
      if (peak > ceiling) {
        ceiling = peak;
      }
    }

    // Normalised against the loudest slice, so a quietly mastered track still
    // fills the bar rather than drawing as a flat line.
    if (ceiling > 0) {
      for (let i = 0; i < count; i++) {
        out[i] /= ceiling;
      }
    }
    return out;
  }

  /**
   * How far through the current snippet, 0–1, or 0 when nothing is playing.
   *
   * Read from the context clock rather than counted in JavaScript: it is the
   * same clock the playback is scheduled against, so the bar cannot drift away
   * from what is audible.
   */
  progress(): number {
    if (!this.source || this.playingFor <= 0) {
      return 0;
    }
    const context = this.audio.get();
    if (!context) {
      return 0;
    }
    const elapsed = context.currentTime - this.startedAt;
    return Math.min(Math.max(elapsed / this.playingFor, 0), 1);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.gain) {
      this.gain.gain.value = volume;
    }
  }

  /**
   * Resolves false when the audio could not be decoded, so the caller can fall
   * back to an element rather than losing the round to an unusual codec.
   */
  async load(url: string): Promise<boolean> {
    const generation = ++this.generation;
    this.buffer = null;

    const context = this.audio.get();
    if (!context) {
      return false;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return false;
      }
      const decoded = await context.decodeAudioData(
        await response.arrayBuffer(),
      );
      if (generation !== this.generation) {
        // A newer track was requested while this was decoding.
        return false;
      }
      this.buffer = decoded;
      return true;
    } catch {
      return false;
    }
  }

  /** Discards the loaded audio, so a stale buffer cannot outlive its round. */
  unload(): void {
    this.generation++;
    this.stop();
    this.buffer = null;
  }

  /** Resolves false when it could not play, so the caller can fall back. */
  async play(durationSeconds: number): Promise<boolean> {
    const buffer = this.buffer;
    if (!buffer) {
      return false;
    }
    // Has to happen inside the gesture that triggered playback, or autoplay
    // policy leaves the context suspended and nothing is audible.
    const context = await this.audio.resume();
    if (!context) {
      return false;
    }

    this.stop();

    const gain = context.createGain();
    gain.gain.value = this.volume;
    gain.connect(context.destination);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.onended = () => {
      if (this.source === source) {
        this.source = null;
        this.onEnded?.();
      }
    };

    const seconds = Math.min(durationSeconds, buffer.duration);
    this.source = source;
    this.gain = gain;
    this.startedAt = context.currentTime;
    this.playingFor = seconds;
    // The third argument is what makes the length exact — the audio hardware
    // enforces it rather than a timer racing the main thread.
    source.start(0, 0, seconds);
    return true;
  }

  stop(): void {
    const source = this.source;
    if (!source) {
      return;
    }
    this.source = null;
    this.playingFor = 0;
    // Detached first: onended fires on an explicit stop too, and the caller
    // already knows about this one.
    source.onended = null;
    try {
      source.stop();
    } catch {
      // Already stopped; nothing to undo.
    }
  }
}
