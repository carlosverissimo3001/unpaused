'use client';

import { motion } from 'framer-motion';
import { GameStatsDtoUnitEnum } from '@/sdk';
import type { GameStatsDto } from '@/sdk';
import type { GauntletHistorySummaryDto } from '@/sdk/models/GauntletHistorySummaryDto';
import type { ModeDescriptor } from './modes';
import { GuessDistribution } from './GuessDistribution';

interface Hero {
  value: string | number;
  label: string;
  caption: string;
}

interface Supporting {
  label: string;
  value: string | number;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** The number a mode is actually about, said once and said large. */
function gameHero(stats: GameStatsDto): Hero {
  const isDaily = stats.unit === GameStatsDtoUnitEnum.Days;

  return {
    value: stats.current,
    label: isDaily ? 'Day streak' : 'Win run',
    caption: isDaily
      ? `Best ${stats.best} ${stats.best === 1 ? 'day' : 'days'}`
      : `Best ${stats.best} in a row`,
  };
}

function gameSupporting(stats: GameStatsDto): Supporting[] {
  return [
    { label: 'Played', value: stats.totalGames },
    { label: 'Won', value: stats.totalWins },
    { label: 'Win rate', value: percent(stats.winRate) },
  ];
}

function runHero(summary: GauntletHistorySummaryDto): Hero {
  return {
    value: summary.bestScore,
    label: 'Best run',
    caption: `${summary.totalRuns} ${summary.totalRuns === 1 ? 'run' : 'runs'}`,
  };
}

function runSupporting(summary: GauntletHistorySummaryDto): Supporting[] {
  const answers = summary.totalCorrectAnswers + summary.totalRuns;
  return [
    {
      label: 'Avg. score',
      value: Number.isInteger(summary.averageScore)
        ? summary.averageScore
        : summary.averageScore.toFixed(1),
    },
    { label: 'Runs', value: summary.totalRuns },
    {
      label: 'Accuracy',
      value:
        answers === 0 ? '—' : percent(summary.totalCorrectAnswers / answers),
    },
  ];
}

interface StatsPanelProps {
  mode: ModeDescriptor;
  stats?: GameStatsDto;
  runSummary?: GauntletHistorySummaryDto;
  children?: React.ReactNode;
}

/**
 * The same panel on every tab, so switching tabs never changes the shape of
 * the page — only the numbers in it. Each mode leads with the figure it is
 * actually about rather than three equal tiles, two of which meant nothing.
 */
export function StatsPanel({
  mode,
  stats,
  runSummary,
  children,
}: StatsPanelProps) {
  // Nothing played yet: a 5xl zero over three more zeroes reads as broken
  // rather than empty, so the panel says what would fill it instead.
  const isEmpty = runSummary
    ? runSummary.totalRuns === 0
    : !stats || stats.totalGames === 0;

  const hero = isEmpty
    ? null
    : runSummary
      ? runHero(runSummary)
      : stats
        ? gameHero(stats)
        : null;

  const supporting = isEmpty
    ? []
    : runSummary
      ? runSupporting(runSummary)
      : stats
        ? gameSupporting(stats)
        : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-fg/[0.03] border border-fg/10 backdrop-blur-sm overflow-hidden"
    >
      <div className="p-5">
        {isEmpty && (
          <p className="text-sm text-fg/40 leading-relaxed">
            {mode.emptyStats}
          </p>
        )}

        {hero && (
          <>
            <div className="flex items-baseline gap-2.5">
              <span
                className={`text-5xl font-black tabular-nums leading-none ${mode.accent.text}`}
              >
                {hero.value}
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-fg/40">
                {hero.label}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-fg/35">{hero.caption}</p>
          </>
        )}

        {supporting.length > 0 && (
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-fg/[0.07] pt-4">
            {supporting.map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-fg/30">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums text-fg/80">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {stats && !isEmpty && (
          <div className="mt-5 border-t border-fg/[0.07] pt-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-fg/30">
              Won on guess
            </p>
            <GuessDistribution
              distribution={stats.roundDistribution}
              barClass={mode.accent.bar}
            />
          </div>
        )}
      </div>

      {children}
    </motion.div>
  );
}
