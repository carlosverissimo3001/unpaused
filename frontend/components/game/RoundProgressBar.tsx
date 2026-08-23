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
  /** Peak amplitudes of the track, 0–1. Falls back to a plain bar if empty. */
  peaks?: number[];
  isPlaying?: boolean;
}

/**
 * The lit portion of the waveform, revealed left to right by the playhead.
 *
 * Done with a clip rather than by re-rendering the bars: the value changes
 * every frame, and clipping moves one element instead of ninety-six.
 */
function Playhead({
  progress,
  ceiling,
  children,
}: {
  progress: MotionValue<number>;
  ceiling: number;
  children: React.ReactNode;
}) {
  const clip = useTransform(
    progress,
    (value) => `inset(0 ${100 - value * ceiling * 100}% 0 0)`,
  );

  return (
    <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
      {children}
    </motion.div>
  );
}

function Bars({ peaks, lit }: { peaks: number[]; lit: boolean }) {
  return (
    <div className="flex h-full w-full items-center gap-px">
      {peaks.map((peak, index) => (
        <span
          key={index}
          className={`flex-1 rounded-full ${
            lit
              ? 'bg-[#1DB954] shadow-[0_0_6px_rgba(29,185,84,0.45)]'
              : 'bg-fg/20'
          }`}
          // A floor so silence still draws a line rather than a gap.
          style={{ height: `${Math.max(peak, 0.08) * 100}%` }}
        />
      ))}
    </div>
  );
}

/**
 * The track's own waveform, doubling as the progress bar.
 *
 * Full width is the longest snippet, so the bar is the audio budget: the lit
 * portion is how much of the song you have earned, and each tick is what the
 * next miss unlocks. Peaks come from the buffer already decoded for playback,
 * so drawing the real song costs nothing extra.
 *
 * At rest it stays at the current ceiling rather than emptying, which is what
 * makes the 0.1s round legible — the fill crosses a sliver of the bar in a
 * tenth of a second, but it stays where it landed instead of blinking out.
 */
export function RoundProgressBar({
  currentRound,
  guesses,
  totalRounds,
  snippetSteps,
  progress,
  peaks = [],
  isPlaying = false,
}: RoundProgressBarProps) {
  const steps =
    snippetSteps && snippetSteps.length === totalRounds
      ? snippetSteps
      : Array.from({ length: totalRounds }, (_, index) => index + 1);

  const longest = steps[steps.length - 1] || 1;
  const round = Math.min(currentRound, totalRounds - 1);
  const ceiling = (steps[round] ?? longest) / longest;
  const hasWaveform = peaks.length > 0;

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <div
        className={`relative ${hasWaveform ? 'h-7 sm:h-9' : 'h-1.5 sm:h-2 rounded-full bg-fg/15 overflow-hidden'}`}
      >
        {hasWaveform ? (
          <>
            <Bars peaks={peaks} lit={false} />
            {isPlaying && progress ? (
              <Playhead progress={progress} ceiling={ceiling}>
                <Bars peaks={peaks} lit />
              </Playhead>
            ) : (
              <div
                className="absolute inset-0 transition-[clip-path] duration-300"
                style={{ clipPath: `inset(0 ${100 - ceiling * 100}% 0 0)` }}
              >
                <Bars peaks={peaks} lit />
              </div>
            )}
          </>
        ) : isPlaying && progress ? (
          <Playhead progress={progress} ceiling={ceiling}>
            <div className="h-full w-full bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]" />
          </Playhead>
        ) : (
          <div
            className="absolute inset-y-0 left-0 bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)] transition-[width] duration-300"
            style={{ width: `${ceiling * 100}%` }}
          />
        )}

        {/* What the next miss unlocks, coloured once spent by how close the
            guess was. The last step is the end of the bar. */}
        {steps.slice(0, -1).map((step, index) => {
          const result = guesses[index]?.result;
          const style = result != null ? getGuessResultStyle(result) : null;

          return (
            <span
              key={step}
              aria-hidden
              className={`absolute inset-y-0 w-px ${style?.barClass ?? 'bg-fg/25'}`}
              style={{ left: `${(step / longest) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
