import { weightedPick } from './weighted-pick';

const candidate = (id: string, fame: number, year = 2005) => ({
  id,
  fame,
  year,
});

describe('weightedPick', () => {
  const seeded = (values: number[]) => {
    let i = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => values[i++ % values.length]);
  };

  afterEach(() => jest.restoreAllMocks());

  it('returns null for an empty pool', () => {
    expect(weightedPick([])).toBeNull();
  });

  it('returns the only candidate', () => {
    expect(weightedPick([candidate('a', 500)])).toBe('a');
  });

  it('picks proportionally to fame', () => {
    const pool = [candidate('a', 100), candidate('b', 200), candidate('c', 700)];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };

    for (let i = 0; i < 60_000; i++) {
      counts[weightedPick(pool)!]++;
    }

    // 1,000 total weight, so roughly 10 / 20 / 70 percent.
    expect(counts.a / 60_000).toBeCloseTo(0.1, 1);
    expect(counts.b / 60_000).toBeCloseTo(0.2, 1);
    expect(counts.c / 60_000).toBeCloseTo(0.7, 1);
  });

  it('lands on the first candidate at the bottom of the range', () => {
    seeded([0]);
    expect(
      weightedPick([candidate('a', 1), candidate('b', 999_999)]),
    ).toBe('a');
  });

  it('lands on the last candidate at the top of the range', () => {
    // Math.random() never returns 1, so this is the closest the walk gets.
    seeded([0.999_999_999]);
    expect(
      weightedPick([candidate('a', 999_999), candidate('b', 1)]),
    ).toBe('b');
  });

  it('never returns an excluded candidate', () => {
    const pool = [candidate('a', 100), candidate('b', 100), candidate('c', 100)];
    const exclude = new Set(['a', 'b']);

    for (let i = 0; i < 500; i++) {
      expect(weightedPick(pool, exclude)).toBe('c');
    }
  });

  it('returns null when everything is excluded', () => {
    const pool = [candidate('a', 100), candidate('b', 100)];
    expect(weightedPick(pool, new Set(['a', 'b']))).toBeNull();
  });

  it('treats a zero-fame candidate as reachable rather than dividing by nothing', () => {
    const pool = [candidate('a', 0)];
    expect(weightedPick(pool)).toBe('a');
  });
});
