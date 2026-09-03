/** Mirrors ROUND_DURATIONS in the backend's game consts. */
export const SNIPPET_STEPS = [0.1, 1, 2, 4, 7, 12] as const;

export const TOTAL_SECONDS = SNIPPET_STEPS.reduce((sum, s) => sum + s, 0);

/** Seconds of audio heard by the end of a given round (1-indexed). */
export function secondsHeard(round: number): number {
  const clamped = Math.max(0, Math.min(round, SNIPPET_STEPS.length));
  return Number(
    SNIPPET_STEPS.slice(0, clamped)
      .reduce((sum, s) => sum + s, 0)
      .toFixed(1),
  );
}

/** Where each round's snippet ends, as a fraction of the full track. */
export function stepBoundaries(): number[] {
  return SNIPPET_STEPS.map((_, i) => secondsHeard(i + 1) / TOTAL_SECONDS);
}

export function formatSeconds(seconds: number): string {
  return seconds < 1 ? `${seconds}s` : `${Number(seconds.toFixed(1))}s`;
}
