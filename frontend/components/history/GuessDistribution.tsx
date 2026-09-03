'use client';

import { motion } from 'framer-motion';

const LABELS = ['1', '2', '3', '4', '5', '6', 'X'];

interface GuessDistributionProps {
  distribution: number[];
  /** Painted in the tab's accent; everything else stays neutral. */
  barClass: string;
  /** Lights the bar for a round just finished, so a result lands somewhere. */
  highlightIndex?: number;
}

/**
 * Which guess your wins land on — the one thing the stats know that a player
 * cannot count themselves, and the part of a Wordle-shaped game people
 * actually screenshot. It used to be read for index 0 alone and shown as
 * "perfect scores", which rendered a bare 0 for most people.
 */
export function GuessDistribution({
  distribution,
  barClass,
  highlightIndex,
}: GuessDistributionProps) {
  const total = distribution.reduce((sum, n) => sum + n, 0);
  const max = Math.max(1, ...distribution);

  return (
    <div className="space-y-1.5">
      {LABELS.map((label, i) => {
        const value = distribution[i] ?? 0;
        const isLoss = i === LABELS.length - 1;
        const isHighlighted = i === highlightIndex;

        return (
          <div key={label} className="flex items-center gap-2.5">
            <span
              className={`w-3 text-[11px] font-bold tabular-nums ${
                isLoss ? 'text-fg/25' : 'text-fg/45'
              }`}
            >
              {label}
            </span>
            <div className="flex-1 h-5 rounded-md bg-fg/[0.06] overflow-hidden">
              <motion.div
                className={`h-full rounded-md ${
                  isLoss ? 'bg-fg/20' : barClass
                } ${isHighlighted ? 'ring-2 ring-fg/40' : ''}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.max(value && 4, (value / max) * 100)}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 80,
                  damping: 18,
                  delay: i * 0.05,
                }}
              />
            </div>
            <span className="w-6 text-right text-[11px] tabular-nums text-fg/40">
              {total === 0 ? (
                <span className="text-fg/20">—</span>
              ) : (
                value || <span className="text-fg/20">0</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
