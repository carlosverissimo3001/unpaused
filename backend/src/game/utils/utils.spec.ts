import { formatUtcDay, gameNumberFromDate } from './utils';

describe('gameNumberFromDate', () => {
  it('starts at 1 on launch day', () => {
    expect(gameNumberFromDate(new Date('2026-09-01T00:00:00Z'))).toBe(1);
    expect(gameNumberFromDate(new Date('2026-09-01T23:59:59Z'))).toBe(1);
  });

  it('advances one per day', () => {
    expect(gameNumberFromDate(new Date('2026-09-02T09:00:00Z'))).toBe(2);
    expect(gameNumberFromDate(new Date('2027-09-01T09:00:00Z'))).toBe(366);
  });

  it("counts UTC days rather than the server's", () => {
    // Same UTC day either side of a local midnight in the Americas and Asia.
    expect(gameNumberFromDate(new Date('2026-09-03T00:30:00Z'))).toBe(3);
    expect(gameNumberFromDate(new Date('2026-09-03T23:30:00Z'))).toBe(3);
  });

  it('is unmoved by a DST boundary', () => {
    // Europe leaves summer time on 2026-10-25.
    const before = gameNumberFromDate(new Date('2026-10-24T12:00:00Z'));
    expect(gameNumberFromDate(new Date('2026-10-25T12:00:00Z'))).toBe(
      before + 1,
    );
    expect(gameNumberFromDate(new Date('2026-10-26T12:00:00Z'))).toBe(
      before + 2,
    );
  });
});

describe('formatUtcDay', () => {
  it('reports the UTC day, not the local one', () => {
    expect(formatUtcDay(new Date('2026-09-03T23:30:00Z'))).toBe('2026-09-03');
    expect(formatUtcDay(new Date('2026-09-04T00:30:00Z'))).toBe('2026-09-04');
  });
});
