/**
 * A log you can read off a phone, because iOS Chrome cannot be inspected from
 * Windows and every fix so far has been a guess at a black box.
 *
 * Off unless the page is opened with ?debug=audio.
 */
const MAX_LINES = 24;

let lines: string[] = [];
let listeners = new Set<() => void>();

export function audioDebugEnabled(): boolean {
  // Never throws: a switch for reading a log is not worth an exception.
  try {
    return new URLSearchParams(window.location.search).get('debug') === 'audio';
  } catch {
    return false;
  }
}

export function logAudio(message: string): void {
  if (!audioDebugEnabled()) return;
  const at = new Date().toISOString().slice(14, 23);
  lines = [...lines.slice(-(MAX_LINES - 1)), `${at} ${message}`];
  listeners.forEach((fn) => fn());
}

export function getAudioLog(): string[] {
  return lines;
}

export function subscribeAudioLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
