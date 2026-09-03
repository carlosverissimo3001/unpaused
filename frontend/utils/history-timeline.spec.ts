import { buildTimeline, entryDate } from './history-timeline';
import type { TimelineEntry } from '@/hooks/history/useModeHistory';
import type { StreakFreezeUsageDto } from '@/sdk/models/StreakFreezeUsageDto';

const game = (date: string, id = date): TimelineEntry => ({
  type: 'game',
  data: { id, date } as TimelineEntry extends { type: 'game'; data: infer D }
    ? D
    : never,
});

const freeze = (coveredFrom: string, coveredTo: string): StreakFreezeUsageDto =>
  ({ id: `f-${coveredFrom}`, coveredFrom, coveredTo }) as StreakFreezeUsageDto;

const dailyOptions = { markMissedDays: true, isFiltered: false };

describe('buildTimeline', () => {
  it('orders newest first', () => {
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-03'), game('2026-03-02')],
      [],
      { markMissedDays: false, isFiltered: false },
    );

    expect(timeline.map(entryDate)).toEqual([
      '2026-03-03',
      '2026-03-02',
      '2026-03-01',
    ]);
  });

  it('marks a missed day on the daily', () => {
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-04')],
      [],
      dailyOptions,
    );

    expect(timeline).toHaveLength(3);
    expect(timeline[1]).toEqual({
      type: 'streak-lost',
      data: { from: '2026-03-02', to: '2026-03-03', gapDays: 2 },
    });
  });

  it('leaves consecutive days alone', () => {
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-02')],
      [],
      dailyOptions,
    );

    expect(timeline.every((e) => e.type === 'game')).toBe(true);
  });

  it('does not mark missed days outside the daily', () => {
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-09')],
      [],
      { markMissedDays: false, isFiltered: false },
    );

    expect(timeline).toHaveLength(2);
  });

  it('does not invent missed days from a filtered list', () => {
    // Filtering hides games, so the holes it leaves are not days off.
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-09')],
      [],
      { markMissedDays: true, isFiltered: true },
    );

    expect(timeline).toHaveLength(2);
  });

  it('interleaves a freeze into the run it covered', () => {
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-03')],
      [freeze('2026-03-02', '2026-03-02')],
      dailyOptions,
    );

    expect(timeline.map((e) => e.type)).toEqual(['game', 'freeze', 'game']);
  });

  it('does not mark the days a multi-day freeze paid for', () => {
    // Won the 1st, froze the 2nd and 3rd, won the 4th: nothing was missed.
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-04')],
      [freeze('2026-03-02', '2026-03-03')],
      dailyOptions,
    );

    expect(timeline.map((e) => e.type)).toEqual(['game', 'freeze', 'game']);
  });

  it('still marks a day left uncovered beside a freeze', () => {
    // The 2nd and 3rd were frozen, the 5th was not, so the 5th is a gap.
    const timeline = buildTimeline(
      [game('2026-03-01'), game('2026-03-06')],
      [freeze('2026-03-02', '2026-03-03')],
      dailyOptions,
    );

    const lost = timeline.filter((e) => e.type === 'streak-lost');
    expect(lost).toHaveLength(1);
    expect(lost[0]).toMatchObject({
      data: { from: '2026-03-04', to: '2026-03-05', gapDays: 2 },
    });
  });

  it('is empty for an empty history', () => {
    expect(buildTimeline([], [], dailyOptions)).toEqual([]);
  });
});
