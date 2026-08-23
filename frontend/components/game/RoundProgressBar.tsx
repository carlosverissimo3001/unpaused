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
  /** Peak amplitudes of the track, 0–1. Flat bars are drawn until they arrive. */
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
          className={`flex-1 rounded-full transition-[height] duration-500 ease-out ${
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
 * Flat bars at the resting height, shown while the audio is still decoding.
 *
 * The real peaks replace these in place, and the height transition carries
 * them up — so the waveform grows out of the placeholder rather than a flat
 * line being swapped for a jagged one.
 */
const PLACEHOLDER_PEAKS: number[] = Array.from({ length: 96 }, () => 0);

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
  const drawn = peaks.length > 0 ? peaks : PLACEHOLDER_PEAKS;

  /**
   * A square-root scale, because the steps span two orders of magnitude.
   * Placed proportionally, 0.1s through 2s share the left sixth of the bar
   * while the last round owns the right half — five guesses of crawling
   * followed by one leap, with the early labels colliding. A log scale
   * over-corrects: the 0.1s to 1s jump is tenfold where the rest are roughly
   * double, so round one would take half the bar.
   *
   * Square root lands the marks at 9 / 29 / 41 / 58 / 76 / 100%, so every
   * round is a step of similar size while round one stays visibly a sliver.
   * The fill is no longer literally seconds of audio, which nobody was
   * measuring off a progress bar anyway.
   */
  const position = (seconds: number) => Math.sqrt(seconds / longest);

  const ceiling = position(steps[round] ?? longest);

  /** "0.1s" rather than "0.1000000000001s". */
  const label = (seconds: number) =>
    `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;

  return (
    // Same column as everything below: at full width the bar reached past
    // the search card and read as a separate element.
    <div className="mx-auto w-full max-w-xl mb-4 sm:mb-6 md:mb-8">
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
              style={{ left: `${position(step) * 100}%` }}
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
        <Bars peaks={drawn} lit={false} />
        {isPlaying && progress ? (
          <Playhead progress={progress} ceiling={ceiling}>
            <Bars peaks={drawn} lit />
          </Playhead>
        ) : (
          <div
            className="absolute inset-0 transition-[clip-path] duration-300"
            style={{ clipPath: `inset(0 ${100 - ceiling * 100}% 0 0)` }}
          >
            <Bars peaks={drawn} lit />
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
              style={{ left: `${position(step) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
