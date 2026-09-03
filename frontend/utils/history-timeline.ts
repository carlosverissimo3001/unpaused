import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type {
  StreakLostEntry,
  TimelineEntry,
} from '@/hooks/history/useModeHistory';
import type { StreakFreezeUsageDto } from '@/sdk/models/StreakFreezeUsageDto';

export function entryDate(entry: TimelineEntry): string {
  if (entry.type === 'game') return entry.data.date;
  if (entry.type === 'freeze') return entry.data.coveredTo;
  if (entry.type === 'run') return entry.data.date;
  return entry.data.to;
}

interface BuildTimelineOptions {
  /** Only the daily has a notion of a day missed, so only it grows markers. */
  markMissedDays: boolean;
  /** A filtered list has holes by design; they are not missed days. */
  isFiltered: boolean;
}

/**
 * Interleaves games with the freezes that covered a gap, newest first, and —
 * for the daily — marks the gaps nothing covered.
 */
export function buildTimeline(
  games: TimelineEntry[],
  freezeUsages: StreakFreezeUsageDto[],
  options: BuildTimelineOptions,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...games,
    ...freezeUsages.map((data) => ({ type: 'freeze' as const, data })),
  ];
  entries.sort((a, b) => entryDate(b).localeCompare(entryDate(a)));

  if (!options.markMissedDays || options.isFiltered || entries.length < 2) {
    return entries;
  }

  const result: TimelineEntry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const gap = differenceInCalendarDays(
      parseISO(entryDate(entries[i - 1])),
      parseISO(entryDate(entries[i])),
    );

    if (gap > 1) {
      result.push({ type: 'streak-lost', data: missedDays(entries, i, gap) });
    }
    result.push(entries[i]);
  }

  return result;
}

function missedDays(
  entries: TimelineEntry[],
  index: number,
  gap: number,
): StreakLostEntry {
  const newer = parseISO(entryDate(entries[index - 1]));
  const older = parseISO(entryDate(entries[index]));

  return {
    from: format(addDays(older, 1), 'yyyy-MM-dd'),
    to: format(addDays(newer, -1), 'yyyy-MM-dd'),
    gapDays: gap - 1,
  };
}
