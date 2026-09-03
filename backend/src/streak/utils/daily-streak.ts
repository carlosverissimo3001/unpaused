import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';

/**
 * The streak a daily win leaves behind.
 *
 * Pure, so both the service that writes it after a round and the migration
 * that rebuilds it from history reach the same answer.
 *
 * 1. Already won today → unchanged, a second win the same day is not a day
 * 2. Won yesterday → the next day of the same run
 * 3. Anything older → back to one; a freeze, if the player spent one, has
 *    already moved lastWin forward to cover the gap
 */
export function nextDailyStreak(params: {
  currentStreak: number;
  timezone: string;
  now: Date;
  lastWin?: Date;
}): number {
  const { currentStreak, timezone, now, lastWin } = params;

  if (!lastWin) return 1;

  const days = differenceInCalendarDays(
    startOfDay(new TZDate(now, timezone)),
    startOfDay(new TZDate(lastWin, timezone)),
  );

  if (days === 0) return currentStreak;
  if (days === 1) return currentStreak + 1;
  return 1;
}

/**
 * The run a free-play round leaves behind: consecutive wins, reset by a loss.
 * Counted in rounds, not days, which is why it is not a streak.
 */
export function nextRun(currentRun: number, won: boolean): number {
  return won ? currentRun + 1 : 0;
}
