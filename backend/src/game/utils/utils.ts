import { differenceInCalendarDays, format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

const EPOCH = new Date('2025-01-01T00:00:00Z');

/**
 * The number has to name the same song for everyone who shares it, and the
 * daily is drawn per UTC day, so this counts UTC days too — never the server's.
 */
export function gameNumberFromDate(date: Date): number {
  return differenceInCalendarDays(
    new TZDate(date, 'UTC'),
    new TZDate(EPOCH, 'UTC'),
  );
}

/** The UTC day, for the same reason the number is one. */
export function formatUtcDay(date: Date): string {
  return format(new TZDate(date, 'UTC'), 'yyyy-MM-dd');
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 * @param array - The array to shuffle
 */
export function shuffleInPlace<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
