'use client';

const LABELS = ['1', '2', '3', '4', '5', '6', 'X'];
const LOSS_INDEX = LABELS.length - 1;

interface GuessDistributionProps {
  distribution: number[];
  /** Painted in the tab's accent; everything else stays neutral. */
  barClass: string;
}

/**
 * Which guess your wins land on — the one thing the stats know that a player
 * cannot count themselves, and the part of a Wordle-shaped game people
 * actually screenshot.
 */
export function GuessDistribution({
  distribution,
  barClass,
}: GuessDistributionProps) {
  const winBuckets = distribution.slice(0, LOSS_INDEX);
  const wins = winBuckets.reduce((sum, n) => sum + n, 0);
  const total = distribution.reduce((sum, n) => sum + n, 0);
  const max = Math.max(1, ...distribution);

  // Only call it a habit once there is more than a round or two behind it.
  const usual = wins > 2 ? winBuckets.indexOf(Math.max(...winBuckets)) : -1;

  return (
    <div>
      <div className="space-y-1.5">
        {LABELS.map((label, i) => {
          const value = distribution[i] ?? 0;
          const isLoss = i === LOSS_INDEX;
          const isUsual = i === usual;

          return (
            <div key={label} className="flex items-center gap-2.5">
              <span
                className={`w-3 shrink-0 text-[11px] font-bold tabular-nums ${
                  isUsual ? 'text-fg/70' : 'text-fg/30'
                }`}
              >
                {label}
              </span>

              <div className="h-5 flex-1 overflow-hidden rounded-md bg-fg/[0.05]">
                <div
                  className={`h-full rounded-md transition-[width] duration-500 ease-out ${
                    isLoss ? 'bg-fg/15' : barClass
                  } ${isUsual || isLoss ? '' : 'opacity-60'}`}
                  style={{
                    width: value ? `max(6px, ${(value / max) * 100}%)` : 0,
                  }}
                />
              </div>

              <span
                className={`w-4 shrink-0 text-right text-[11px] tabular-nums ${
                  isUsual ? 'text-fg/70' : 'text-fg/30'
                }`}
              >
                {total === 0 ? '—' : value}
              </span>
            </div>
          );
        })}
      </div>

      {usual >= 0 && (
        <p className="mt-3 text-xs text-fg/40">
          You usually get it on guess{' '}
          <span className="font-semibold text-fg/70">{LABELS[usual]}</span>
        </p>
      )}
    </div>
  );
}
