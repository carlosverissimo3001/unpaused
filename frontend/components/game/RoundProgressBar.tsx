'use client';

import { motion } from 'framer-motion';
import { getGuessResultStyle } from './guess-result-styles';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface Guess {
  result: GuessHistoryDtoResultEnum | null;
}

interface RoundProgressBarProps {
  currentRound: number;
  guesses: Guess[];
  totalRounds: number;
}

export function RoundProgressBar({
  currentRound,
  guesses,
  totalRounds,
}: RoundProgressBarProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 md:mb-8">
      {Array.from({ length: totalRounds }, (_, index) => {
        const result = guesses[index]?.result;
        const style = result != null ? getGuessResultStyle(result) : null;
        const isCompleted = index < currentRound;
        const isCurrent = index === currentRound;

        return (
          <motion.div
            key={index}
            layout
            className="flex-1 h-1.5 sm:h-2 rounded-full relative overflow-visible"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div
              className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                isCompleted
                  ? (style?.barClass ?? 'bg-red-500')
                  : isCurrent
                    ? 'bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]'
                    : 'bg-fg/20'
              }`}
              {...(isCurrent && {
                animate: { opacity: [0.7, 1, 0.7] },
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut' as const,
                },
              })}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
