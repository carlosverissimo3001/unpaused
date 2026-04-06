'use client';

import { BarChart3, Crown, Layers3, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GauntletHistorySummaryDto } from '@/sdk/models/GauntletHistorySummaryDto';
import type { GauntletDifficultyFilter } from '@/hooks/speed-run/useSpeedRunHistory';

const DIFFICULTY_OPTIONS: Array<{
  value?: GauntletDifficultyFilter;
  label: string;
}> = [
    { value: undefined, label: 'All' },
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
    { value: 'EXPERT', label: 'Expert' },
  ];

function formatAverage(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatAccuracy(correct: number, totalRuns: number): string {
  const totalAnswers = correct + totalRuns; // each run ends with exactly 1 wrong
  if (totalAnswers === 0) return '0%';
  return `${Math.round((correct / totalAnswers) * 100)}%`;
}

interface GauntletHistoryOverviewProps {
  summary: GauntletHistorySummaryDto;
  selectedDifficulty?: GauntletDifficultyFilter;
  onDifficultyChange: (difficulty?: GauntletDifficultyFilter) => void;
}

export function GauntletHistoryOverview({
  summary,
  selectedDifficulty,
  onDifficultyChange,
}: GauntletHistoryOverviewProps) {
  const stats = [
    {
      label: 'Best run',
      value: summary.bestScore,
      icon: Crown,
      tone: 'text-amber-300 border-amber-400/20 bg-amber-400/10',
    },
    {
      label: 'Avg. score',
      value: formatAverage(summary.averageScore),
      icon: BarChart3,
      tone: 'text-sky-300 border-sky-400/20 bg-sky-400/10',
    },
    {
      label: 'Total runs',
      value: summary.totalRuns,
      icon: Layers3,
      tone: 'text-fg/80 border-fg/10 bg-fg/[0.04]',
    },
    {
      label: 'Accuracy',
      value: formatAccuracy(summary.totalCorrectAnswers, summary.totalRuns),
      icon: Target,
      tone: 'text-spotify-green border-spotify-green/20 bg-spotify-green/10',
    },
  ];

  return (
    <section className="mb-5 sm:mb-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-[24px] border border-fg/8 bg-fg/[0.02] p-4 sm:p-5 backdrop-blur-sm"
      >
        <div className="flex flex-wrap gap-1.5 mb-4">
          {DIFFICULTY_OPTIONS.map((option) => {
            const active = selectedDifficulty === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onDifficultyChange(option.value)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-all ${active
                  ? 'border-fg/20 bg-fg/10 text-fg'
                  : 'border-transparent bg-transparent text-fg/35 hover:text-fg/60'
                  }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border px-4 py-3 backdrop-blur-sm ${stat.tone}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-current/70">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 text-current/80" />
                </div>
                <div className="mt-2 text-2xl font-black tabular-nums text-fg">
                  {stat.value}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
