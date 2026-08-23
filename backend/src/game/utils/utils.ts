import { startOfDay } from 'date-fns';

export function gameNumberFromDate(date: Date): number {
  const epoch = new Date('2025-01-01');
  return Math.floor(
    (startOfDay(date).getTime() - startOfDay(epoch).getTime()) /
      (24 * 60 * 60 * 1000),
  );
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
