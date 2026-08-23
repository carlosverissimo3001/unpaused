'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { getGuessResultStyle } from './guess-result-styles';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface Guess {
  result: GuessHistoryDtoResultEnum | null;
}

interface RoundProgressBarProps {
  currentRound: number;
  guesses: Guess[];
  totalRounds: number;
  /** 0–1 through the snippet now playing. Drives the fill on the live segment. */
  progress?: MotionValue<number>;
}

/**
 * The segment for the round being played, filling left to right with the
 * playhead. Split out so the MotionValue only re-renders this, not the bar.
 */
function PlayingSegment({ progress }: { progress: MotionValue<number> }) {
  const width = useTransform(progress, (value) => `${value * 100}%`);

  return (
    <>
      <div className="absolute inset-0 rounded-full bg-[#1DB954]/25" />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]"
        style={{ width }}
      />
    </>
  );
}

export function RoundProgressBar({
  currentRound,
  guesses,
  totalRounds,
  progress,
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
            className="flex-1 h-1.5 sm:h-2 rounded-full relative overflow-hidden"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {isCurrent && progress ? (
              <PlayingSegment progress={progress} />
            ) : (
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
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
