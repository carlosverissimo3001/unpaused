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
  /** 0–1 through the snippet now playing. */
  progress?: MotionValue<number>;
}

/**
 * The live round's share of the track, growing with the playhead. Its own
 * component so a sixty-times-a-second value re-renders one element, not the bar.
 */
function Playhead({
  progress,
  start,
  share,
}: {
  progress: MotionValue<number>;
  start: number;
  share: number;
}) {
  const width = useTransform(progress, (value) => `${value * share * 100}%`);

  return (
    <motion.div
      className="absolute inset-y-0 bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]"
      style={{ left: `${start * 100}%`, width }}
    />
  );
}

/**
 * One continuous track rather than a row of pills: the game is a single run of
 * audio you unlock more of, and a bar that reads as one line says that where
 * six separate ones did not.
 *
 * Rounds are equal width rather than proportional to their snippet length.
 * Proportional is more honest about the audio budget, but at 0.1s of a
 * ten-second run the first round would be a one-percent sliver, and the
 * separators would pile up against the left edge.
 */
export function RoundProgressBar({
  currentRound,
  guesses,
  totalRounds,
  progress,
}: RoundProgressBarProps) {
  const share = 1 / totalRounds;

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <div className="relative h-1.5 sm:h-2 rounded-full bg-fg/15 overflow-hidden">
        {/* Rounds already spent, coloured by how close the guess was. */}
        {Array.from({ length: totalRounds }, (_, index) => {
          if (index >= currentRound) {
            return null;
          }
          const result = guesses[index]?.result;
          const style = result != null ? getGuessResultStyle(result) : null;

          return (
            <div
              key={index}
              className={`absolute inset-y-0 ${style?.barClass ?? 'bg-red-500'}`}
              style={{
                left: `${index * share * 100}%`,
                width: `${share * 100}%`,
              }}
            />
          );
        })}

        {progress ? (
          <Playhead
            progress={progress}
            start={currentRound * share}
            share={share}
          />
        ) : (
          <motion.div
            className="absolute inset-y-0 bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]"
            style={{
              left: `${currentRound * share * 100}%`,
              width: `${share * 100}%`,
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Separators sit on top, so the fill runs underneath them unbroken. */}
        {Array.from({ length: totalRounds - 1 }, (_, index) => (
          <span
            key={`tick-${index}`}
            aria-hidden
            className="absolute inset-y-0 w-px bg-bg/70"
            style={{ left: `${(index + 1) * share * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
