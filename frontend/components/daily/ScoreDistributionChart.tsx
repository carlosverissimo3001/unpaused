'use client';

import { motion } from 'framer-motion';

interface ScoreDistributionChartProps {
  distribution: number[];
  className?: string;
}

const ROUND_LABELS = ['1', '2', '3', '4', '5', '6', 'X'];
const MAX_BARS = 7;

export function ScoreDistributionChart({
  distribution,
  className = '',
}: ScoreDistributionChartProps) {
  const max = Math.max(1, ...distribution);

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-fg/80 mb-3">
        Score distribution
      </h3>
      <div className="space-y-2">
        {ROUND_LABELS.slice(0, Math.min(MAX_BARS, distribution.length)).map(
          (label, i) => {
            const value = distribution[i] ?? 0;
            const pct = max > 0 ? (value / max) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 text-xs text-fg/60">{label}</span>
                <div className="flex-1 h-6 bg-fg/10 rounded overflow-hidden">
                  <motion.div
                    className="h-full bg-spotify-green rounded"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 80,
                      damping: 18,
                      delay: i * 0.06,
                    }}
                  />
                </div>
                <span className="text-xs text-fg/60 w-6 text-right">
                  {value}
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
