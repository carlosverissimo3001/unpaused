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

  /** "0.1s" rather than "0.1000000000001s". */
  const label = (seconds: number) =>
    `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      {/* What each round buys you, sat above the mark it unlocks. Hidden on
          small screens: at these positions the first two are about 25px apart
          on a phone, so they would collide rather than inform. */}
      <div className="relative mb-1 hidden h-3 sm:block">
        {steps.map((step, index) => {
          const spent = index < currentRound;
          const isCurrent = index === round;
          // The end labels are pinned rather than centred: at 0.8% and 100%
          // of the width, centring hangs them off the edges of the bar.
          const align =
            index === 0
              ? 'translate-x-0'
              : index === steps.length - 1
                ? '-translate-x-full'
                : '-translate-x-1/2';

          return (
            <span
              key={step}
              className={`absolute ${align} text-[10px] leading-none tabular-nums transition-colors ${
                isCurrent
                  ? 'font-semibold text-[#1DB954]'
                  : spent
                    ? 'text-fg/40'
                    : 'text-fg/25'
              }`}
              style={{ left: `${(step / longest) * 100}%` }}
            >
              {label(step)}
            </span>
          );
        })}
      </div>
      {/* Height is fixed whether or not the peaks have arrived: it is decoded
          a moment after the round loads, and letting the container grow when
          they land shifts everything below it down the page. */}
      <div className="relative h-7 sm:h-9">
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
        ) : (
          // Same footprint, so swapping to the waveform moves nothing.
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 sm:h-2 rounded-full bg-fg/15 overflow-hidden">
            {isPlaying && progress ? (
              <Playhead progress={progress} ceiling={ceiling}>
                <div className="h-full w-full bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)]" />
              </Playhead>
            ) : (
              <div
                className="absolute inset-y-0 left-0 bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.5)] transition-[width] duration-300"
                style={{ width: `${ceiling * 100}%` }}
              />
            )}
          </div>
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
              // Sits proud of the waveform so it reads as a marker rather than
              // a gap in the bars, and carries the colour of the guess that
              // spent it once that round is behind you.
              className={`absolute -inset-y-1 w-0.5 rounded-full ${
                style?.barClass ?? 'bg-fg/40'
              }`}
              style={{ left: `${(step / longest) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
