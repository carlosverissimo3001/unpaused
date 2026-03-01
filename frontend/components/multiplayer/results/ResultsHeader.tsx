import Image from 'next/image';
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
  personalScore,
}: ResultsHeaderProps) {
  if (outcome === 'won') {
    return (
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          <Trophy className="h-3.5 w-3.5" />
          Champion
        </div>
        <h1
          aria-live="polite"
          className="text-4xl font-black text-white sm:text-5xl"
        >
          You Won!
        </h1>

        {/* Winner avatar showcase */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 18,
          }}
          className="mt-6 flex flex-col items-center"
        >
          <div className="relative">
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-2 rounded-full bg-yellow-400/20 blur-md"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-[3px] ring-yellow-400 shadow-lg shadow-yellow-400/30">
              {winner.avatarUrl ? (
                <Image
                  src={winner.avatarUrl}
                  alt={winner.displayName}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-bold text-white/60">
                  {winner.displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 shadow-lg"
            >
              <Crown className="h-4 w-4 text-yellow-900" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-4"
          >
            <p className="text-sm text-white/50">Final score</p>
            <p className="mt-1 text-5xl font-black tabular-nums text-yellow-400 sm:text-6xl">
              {winner.totalScore}
            </p>
          </motion.div>
        </motion.div>
      </motion.header>
    );
  }

  if (outcome === 'tied') {
    return (
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 text-center"
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
      className="mb-8 text-center"
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
        wins with{' '}
        <span className="font-semibold text-zinc-100">{winner.totalScore}</span>{' '}
        points
      </p>
      {personalScore !== undefined && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-white/40"
        >
          Your score:{' '}
          <span className="font-semibold text-[#1DB954]">{personalScore}</span>
        </motion.p>
      )}
    </motion.header>
  );
}
