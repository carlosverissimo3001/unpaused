'use client';

import {
  TOTAL_SECONDS,
  formatSeconds,
  secondsHeard,
  stepBoundaries,
} from '@/lib/snippet-timeline';

interface ListeningRulerProps {
  /** The round the game ended on, 1-indexed. */
  round: number;
  won: boolean;
}

/**
 * How much of the track it took. The bar is the full 26.1 seconds a round can
 * run to; the fill is what was actually heard before answering, with a tick
 * at each snippet's end.
 */
export function ListeningRuler({ round, won }: ListeningRulerProps) {
  const heard = won ? secondsHeard(round) : TOTAL_SECONDS;
  const fraction = heard / TOTAL_SECONDS;

  return (
    <div className="flex flex-1 items-center gap-2.5 min-w-0">
      <div
        className="relative h-1.5 flex-1 min-w-0 rounded-full bg-fg/[0.07] overflow-hidden"
        role="img"
        aria-label={
          won
            ? `Named it after ${formatSeconds(heard)} of audio`
            : 'Heard the whole snippet without naming it'
        }
      >
        {/* Plain CSS: the card drives its children through variants, which
            leaves a motion child's own width animation stuck at its initial. */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${
            won ? 'bg-spotify-green' : 'bg-red-500/70'
          }`}
          style={{ width: `${fraction * 100}%`, minWidth: 3 }}
        />
        {stepBoundaries()
          .slice(0, -1)
          .map((at) => (
            <span
              key={at}
              className="absolute inset-y-0 w-px bg-bg/60"
              style={{ left: `${at * 100}%` }}
              aria-hidden
            />
          ))}
      </div>
      <span
        className={`shrink-0 text-[11px] font-semibold tabular-nums ${
          won ? 'text-spotify-green' : 'text-red-400/80'
        }`}
      >
        {won ? formatSeconds(heard) : 'Lost'}
      </span>
    </div>
  );
}
