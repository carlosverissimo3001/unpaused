import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';

export const MAX_ROUNDS = 6;

export interface FinishedGame {
  won: boolean;
  /** 0-5 for a win on that round, 6 for a loss — the distribution index. */
  lastGameRound: number;
  completedAt: Date;
}

export interface Freeze {
  coveredFrom: Date;
  coveredTo: Date;
}

export interface Tally {
  current: number;
  best: number;
  totalGames: number;
  totalWins: number;
  roundDistribution: number[];
  lastWinDate: Date | null;
}

const emptyTally = (): Tally => ({
  current: 0,
  best: 0,
  totalGames: 0,
  totalWins: 0,
  roundDistribution: [0, 0, 0, 0, 0, 0, 0],
  lastWinDate: null,
});

function countGame(tally: Tally, game: FinishedGame): void {
  tally.totalGames += 1;
  if (game.won) tally.totalWins += 1;
  tally.roundDistribution[game.lastGameRound] += 1;
}

/**
 * Free play: consecutive wins ended by a single loss, counted in rounds — so
 * two wins in one sitting are two.
 *
 * Games must arrive oldest first.
 */
export function tallyFreePlay(games: FinishedGame[]): Tally {
  const tally = emptyTally();

  for (const game of games) {
    countGame(tally, game);
    tally.current = game.won ? tally.current + 1 : 0;
    tally.best = Math.max(tally.best, tally.current);
  }

  return tally;
}

/**
 * The daily: consecutive days with a win, in the player's timezone.
 *
 * A gap only breaks the streak if no freeze covered it. One that did bridges
 * the gap and counts the frozen days, which is what useFreeze does at the
 * time — replaying it any other way would shorten streaks people spent
 * freezes to keep.
 *
 * Games must arrive oldest first.
 */
export function tallyDaily(
  games: FinishedGame[],
  freezes: Freeze[],
  timezone: string,
): Tally {
  const tally = emptyTally();
  const day = (date: Date) => startOfDay(new TZDate(date, timezone));

  let lastWinDay: Date | null = null;

  for (const game of games) {
    countGame(tally, game);

    if (!game.won) {
      tally.current = 0;
      continue;
    }

    const today = day(game.completedAt);
    const gap = lastWinDay ? differenceInCalendarDays(today, lastWinDay) : null;

    if (gap === null) {
      tally.current = 1;
    } else if (gap === 0) {
      // A second win the same day is not another day.
    } else if (gap === 1) {
      tally.current += 1;
    } else {
      const covered = coveredDays(lastWinDay!, today, freezes, timezone);
      // Only an unbroken bridge keeps the streak; a partial one is still a gap.
      tally.current = covered === gap - 1 ? tally.current + covered + 1 : 1;
    }

    tally.best = Math.max(tally.best, tally.current);
    lastWinDay = today;
    tally.lastWinDate = game.completedAt;
  }

  return tally;
}

/** How many of the days strictly between two wins a freeze paid for. */
export function coveredDays(
  from: Date,
  to: Date,
  freezes: Freeze[],
  timezone: string,
): number {
  const day = (date: Date) => startOfDay(new TZDate(date, timezone));
  const missingCount = differenceInCalendarDays(to, from) - 1;

  const covers = (freeze: Freeze, date: Date) =>
    differenceInCalendarDays(date, day(freeze.coveredFrom)) >= 0 &&
    differenceInCalendarDays(day(freeze.coveredTo), date) >= 0;

  let covered = 0;
  for (let offset = 1; offset <= missingCount; offset++) {
    const missing = addDays(new TZDate(from, timezone), offset);
    if (freezes.some((freeze) => covers(freeze, missing))) covered += 1;
  }

  return covered;
}

/**
 * A win stores the round after the correct guess, so step back one; a loss ran
 * out of rounds and lands in the last bucket.
 */
export function distributionIndex(won: boolean, currentRound: number): number {
  return won ? currentRound - 1 : MAX_ROUNDS;
}
