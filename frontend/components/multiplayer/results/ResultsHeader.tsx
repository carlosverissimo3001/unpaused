import { motion } from 'framer-motion';
import { Crown, Trophy } from 'lucide-react';
import type { ScoreboardPlayerTotalDto } from '@/sdk';
import type { GameOutcome } from './results-utils';

interface ResultsHeaderProps {
  outcome: GameOutcome;
  winner: ScoreboardPlayerTotalDto;
  tiedPlayerNames: string[];
  personalScore?: number;
}

export function ResultsHeader({
  outcome,
  winner,
  tiedPlayerNames,
}: ResultsHeaderProps) {
  if (outcome === 'won') {
    return (
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6 text-center"
      >
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          <Trophy className="h-4 w-4" />
          Champion
        </div>
        <h1
          aria-live="polite"
          className="text-4xl font-black text-white sm:text-5xl"
        >
          You Won!
        </h1>
        <p className="mt-3 text-white/70">Final score</p>
        <div className="mt-1 inline-flex items-center gap-2 text-5xl font-black text-yellow-400 sm:text-6xl">
          <Crown className="h-9 w-9 text-yellow-400" />
          <span className="tabular-nums">{winner.totalScore}</span>
          <Trophy className="h-9 w-9 text-yellow-400" />
        </div>
      </motion.header>
    );
  }

  if (outcome === 'tied') {
    return (
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6 text-center"
      >
        <h1
          aria-live="polite"
          className="text-4xl font-black text-white sm:text-5xl"
        >
          It&apos;s a Tie!
        </h1>
        <p className="mt-3 text-white/60">
          <span className="font-semibold text-yellow-400">
            {tiedPlayerNames.join(' & ')}
          </span>{' '}
          finished with{' '}
          <span className="font-semibold text-yellow-400">
            {winner.totalScore}
          </span>{' '}
          points
        </p>
      </motion.header>
    );
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mb-6 text-center"
    >
      <h1
        aria-live="polite"
        className="text-4xl font-black text-white sm:text-5xl"
      >
        Good Game!
      </h1>
      <p className="mt-3 text-white/60">
        <span className="font-semibold text-zinc-200">
          {winner.displayName}
        </span>{' '}
        takes this round with{' '}
        <span className="font-semibold text-zinc-100">{winner.totalScore}</span>{' '}
        points
      </p>
    </motion.header>
  );
}
