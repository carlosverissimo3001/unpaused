'use client';

import {
  SNIPPET_STEPS,
  formatSeconds,
  secondsHeard,
} from '@/lib/snippet-timeline';

/**
 * Heights follow the snippet lengths on a square root, so 0.1s stays visible
 * next to 12s while the rise still tracks the real durations.
 */
const HEIGHTS = SNIPPET_STEPS.map((seconds) => {
  const longest = SNIPPET_STEPS[SNIPPET_STEPS.length - 1];
  return Math.max(0.18, Math.sqrt(seconds / longest));
});

interface SnippetMeterProps {
  /** The round the game ended on, 1-indexed. */
  round: number;
  won: boolean;
}

/**
 * Six snippets, rising the way the game hands them out. The ones lit are the
 * ones that played before the answer landed — a fast win is two stubs, a loss
 * is the whole run.
 */
export function SnippetMeter({ round, won }: SnippetMeterProps) {
  const heard = won
    ? Math.min(round, SNIPPET_STEPS.length)
    : SNIPPET_STEPS.length;
  const seconds = won ? secondsHeard(round) : null;

  return (
    <div className="flex items-end gap-2.5">
      <div
        className="flex h-6 items-end gap-[3px]"
        role="img"
        aria-label={
          seconds === null
            ? 'Every snippet played without the track being named'
            : `Named after ${formatSeconds(seconds)} of audio`
        }
      >
        {HEIGHTS.map((height, i) => (
          <span
            key={i}
            style={{ height: `${height * 100}%` }}
            className={`w-[3px] rounded-full transition-colors ${
              i < heard
                ? won
                  ? 'bg-spotify-green'
                  : 'bg-red-500/80'
                : 'bg-fg/[0.12]'
            }`}
          />
        ))}
      </div>
      <span
        className={`text-[11px] font-semibold tabular-nums leading-none pb-0.5 ${
          won ? 'text-spotify-green' : 'text-red-400/80'
        }`}
      >
        {seconds === null ? 'Lost' : formatSeconds(seconds)}
      </span>
    </div>
  );
}
