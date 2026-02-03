import {
  GameHistoryEntryDto,
  GameHistoryEntryDtoStatusEnum,
} from '@/sdk/models/GameHistoryEntryDto';
import { computeStreak } from './stats-utills';

function entry(
  overrides: Partial<GameHistoryEntryDto> & {
    date: string;
    status: GameHistoryEntryDtoStatusEnum;
    isDaily: boolean;
  }
): GameHistoryEntryDto {
  return {
    id: 'id',
    date: overrides.date,
    status: overrides.status,
    isDaily: overrides.isDaily,
    guesses: [],
    trackName: '',
    artistName: '',
    ...overrides,
  };
}

describe('computeStreak', () => {
  it('returns 0 for empty list', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 when no daily entries', () => {
    expect(
      computeStreak([
        entry({ date: '2025-02-01', status: 'WON', isDaily: false }),
      ])
    ).toBe(0);
  });

  it('counts consecutive daily wins from most recent date', () => {
    const items = [
      entry({ date: '2025-02-03', status: 'WON', isDaily: true }),
      entry({ date: '2025-02-02', status: 'WON', isDaily: true }),
      entry({ date: '2025-02-01', status: 'WON', isDaily: true }),
    ];
    expect(computeStreak(items)).toBe(3);
  });

  it('stops at first non-win', () => {
    const items = [
      entry({ date: '2025-02-03', status: 'WON', isDaily: true }),
      entry({ date: '2025-02-02', status: 'LOST', isDaily: true }),
      entry({ date: '2025-02-01', status: 'WON', isDaily: true }),
    ];
    expect(computeStreak(items)).toBe(1);
  });

  it('sorts daily entries by date descending before counting', () => {
    const items = [
      entry({ date: '2025-02-01', status: 'WON', isDaily: true }),
      entry({ date: '2025-02-03', status: 'WON', isDaily: true }),
      entry({ date: '2025-02-02', status: 'WON', isDaily: true }),
    ];
    expect(computeStreak(items)).toBe(3);
  });

  it('ignores non-daily when computing streak', () => {
    const items = [
      entry({ date: '2025-02-03', status: 'WON', isDaily: true }),
      entry({ date: '2025-02-02', status: 'WON', isDaily: false }),
      entry({ date: '2025-02-01', status: 'WON', isDaily: true }),
    ];
    expect(computeStreak(items)).toBe(2);
  });

  it('returns 0 when most recent daily is not a win', () => {
    const items = [
      entry({ date: '2025-02-03', status: 'LOST', isDaily: true }),
      entry({ date: '2025-02-02', status: 'WON', isDaily: true }),
    ];
    expect(computeStreak(items)).toBe(0);
  });
});
