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
  /** Snippet length per round. Without it the rounds are drawn equal width. */
  snippetSteps?: number[];
  /** 0–1 through the snippet now playing. */
  progress?: MotionValue<number>;
  isPlaying?: boolean;
}

/**
 * The playhead, growing from the left edge to this round's ceiling.
 *
 * It starts at the left every time because every round replays the song from
 * the beginning — the round does not continue where the last one stopped, it
 * buys you a longer look at the same opening.
 *
 * Its own component so a sixty-times-a-second value re-renders one element.
 */
function Playhead({
  progress,
  ceiling,
}: {
  progress: MotionValue<number>;
  ceiling: number;
}) {
  const width = useTransform(progress, (value) => `${value * ceiling * 100}%`);

  return (
    <motion.div
      className="absolute inset-y-0 left-0 bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]"
      style={{ width }}
    />
  );
}

/**
 * One continuous track whose full width is the longest snippet, so the bar is
 * the audio budget: the fill is how much of the song you have earned, and the
 * ticks are what each miss unlocks next.
 *
 * At rest it sits at the current ceiling rather than emptying. That is what
 * makes a 0.1s round legible — the fill flashes past in a tenth of a second,
 * but it stays where it landed instead of blinking out.
 */
export function RoundProgressBar({
  currentRound,
  guesses,
  totalRounds,
  snippetSteps,
  progress,
  isPlaying = false,
}: RoundProgressBarProps) {
  const steps =
    snippetSteps && snippetSteps.length === totalRounds
      ? snippetSteps
      : // No steps from the API: fall back to evenly spaced rounds.
        Array.from({ length: totalRounds }, (_, index) => index + 1);

  const longest = steps[steps.length - 1] || 1;
  const round = Math.min(currentRound, totalRounds - 1);
  const ceiling = (steps[round] ?? longest) / longest;

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <div className="relative h-1.5 sm:h-2 rounded-full bg-fg/15 overflow-hidden">
        {isPlaying && progress ? (
          <Playhead progress={progress} ceiling={ceiling} />
        ) : (
          <div
            className="absolute inset-y-0 left-0 bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)] transition-[width] duration-300"
            style={{ width: `${ceiling * 100}%` }}
          />
        )}

        {/* One tick per round you could still unlock, coloured once spent by
            how close that guess was. The last step is the end of the bar. */}
        {steps.slice(0, -1).map((step, index) => {
          const result = guesses[index]?.result;
          const style = result != null ? getGuessResultStyle(result) : null;

          return (
            <span
              key={step}
              aria-hidden
              className={`absolute inset-y-0 w-px ${
                style?.barClass ?? 'bg-bg/70'
              }`}
              style={{ left: `${(step / longest) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
