import {
  coveredDays,
  distributionIndex,
  tallyDaily,
  tallyFreePlay,
  type FinishedGame,
  type Freeze,
} from './stats-recompute';

const at = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

const win = (iso: string, round = 2): FinishedGame => ({
  won: true,
  lastGameRound: round,
  completedAt: at(iso),
});

const loss = (iso: string): FinishedGame => ({
  won: false,
  lastGameRound: 6,
  completedAt: at(iso),
});

const freeze = (from: string, to: string): Freeze => ({
  coveredFrom: at(from),
  coveredTo: at(to),
});

describe('distributionIndex', () => {
  it('steps a win back to the round it was actually won on', () => {
    // Won on the first guess: currentRound advanced to 1, bucket is 0.
    expect(distributionIndex(true, 1)).toBe(0);
    expect(distributionIndex(true, 3)).toBe(2);
  });

  it('sends every loss to the last bucket', () => {
    expect(distributionIndex(false, 6)).toBe(6);
  });
});

describe('tallyFreePlay', () => {
  it('counts a run in rounds, so two wins the same day are two', () => {
    const tally = tallyFreePlay([win('2026-03-01'), win('2026-03-01')]);

    expect(tally.current).toBe(2);
    expect(tally.totalGames).toBe(2);
  });

  it('ends the run at a loss but keeps the best', () => {
    const tally = tallyFreePlay([
      win('2026-03-01'),
      win('2026-03-02'),
      win('2026-03-03'),
      loss('2026-03-04'),
      win('2026-03-05'),
    ]);

    expect(tally.current).toBe(1);
    expect(tally.best).toBe(3);
    expect(tally.totalGames).toBe(5);
    expect(tally.totalWins).toBe(4);
  });

  it('never dates a run', () => {
    expect(tallyFreePlay([win('2026-03-01')]).lastWinDate).toBeNull();
  });

  it('files each result in its own bucket', () => {
    const tally = tallyFreePlay([
      win('2026-03-01', 0),
      win('2026-03-02', 0),
      win('2026-03-03', 3),
      loss('2026-03-04'),
    ]);

    expect(tally.roundDistribution).toEqual([2, 0, 0, 1, 0, 0, 1]);
  });
});

describe('tallyDaily', () => {
  it('counts consecutive days', () => {
    const tally = tallyDaily(
      [win('2026-03-01'), win('2026-03-02'), win('2026-03-03')],
      [],
      'UTC',
    );

    expect(tally.current).toBe(3);
    expect(tally.best).toBe(3);
  });

  it('restarts at 1 after an uncovered gap', () => {
    const tally = tallyDaily(
      [win('2026-03-01'), win('2026-03-02'), win('2026-03-06')],
      [],
      'UTC',
    );

    expect(tally.current).toBe(1);
    expect(tally.best).toBe(2);
  });

  it('keeps the streak across a gap a freeze paid for, counting the frozen days', () => {
    const tally = tallyDaily(
      [win('2026-03-01'), win('2026-03-02'), win('2026-03-05')],
      [freeze('2026-03-03', '2026-03-04')],
      'UTC',
    );

    // Two days held, then the day itself: 2 + 2 + 1.
    expect(tally.current).toBe(5);
  });

  it('treats a half-covered gap as a break', () => {
    const tally = tallyDaily(
      [win('2026-03-01'), win('2026-03-02'), win('2026-03-06')],
      [freeze('2026-03-03', '2026-03-04')],
      'UTC',
    );

    // The 5th was never covered, so the streak did break.
    expect(tally.current).toBe(1);
  });

  it('resets on a loss, whatever the calendar says', () => {
    const tally = tallyDaily(
      [win('2026-03-01'), win('2026-03-02'), loss('2026-03-03')],
      [],
      'UTC',
    );

    expect(tally.current).toBe(0);
    expect(tally.best).toBe(2);
  });

  it('does not count a second win on the same day twice', () => {
    const tally = tallyDaily([win('2026-03-01'), win('2026-03-01')], [], 'UTC');

    expect(tally.current).toBe(1);
    expect(tally.totalGames).toBe(2);
  });

  it('dates the streak by the last win', () => {
    const tally = tallyDaily([win('2026-03-01'), win('2026-03-02')], [], 'UTC');

    expect(tally.lastWinDate).toEqual(at('2026-03-02'));
  });

  it('reads days in the player timezone', () => {
    // 23:30 UTC on the 1st is already the 2nd in Auckland, so these are
    // consecutive days there and the same day in UTC.
    const games: FinishedGame[] = [
      {
        won: true,
        lastGameRound: 2,
        completedAt: new Date('2026-03-01T05:00:00.000Z'),
      },
      {
        won: true,
        lastGameRound: 2,
        completedAt: new Date('2026-03-01T23:30:00.000Z'),
      },
    ];

    expect(tallyDaily(games, [], 'UTC').current).toBe(1);
    expect(tallyDaily(games, [], 'Pacific/Auckland').current).toBe(2);
  });
});

describe('coveredDays', () => {
  it('counts only the days between, not the endpoints', () => {
    const covered = coveredDays(
      at('2026-03-01'),
      at('2026-03-05'),
      [freeze('2026-03-01', '2026-03-05')],
      'UTC',
    );

    expect(covered).toBe(3);
  });

  it('is zero when nothing was frozen', () => {
    expect(coveredDays(at('2026-03-01'), at('2026-03-05'), [], 'UTC')).toBe(0);
  });

  it('adds up separate freezes', () => {
    const covered = coveredDays(
      at('2026-03-01'),
      at('2026-03-06'),
      [freeze('2026-03-02', '2026-03-02'), freeze('2026-03-04', '2026-03-05')],
      'UTC',
    );

    expect(covered).toBe(3);
  });
});
