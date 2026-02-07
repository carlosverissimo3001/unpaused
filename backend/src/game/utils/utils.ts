import { startOfDay } from 'date-fns';

export function gameNumberFromDate(date: Date): number {
  const epoch = new Date('2025-01-01');
  return Math.floor(
    (startOfDay(date).getTime() - startOfDay(epoch).getTime()) /
      (24 * 60 * 60 * 1000),
  );
}
