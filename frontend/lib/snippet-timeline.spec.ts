import {
  SNIPPET_STEPS,
  TOTAL_SECONDS,
  formatSeconds,
  secondsHeard,
  stepBoundaries,
} from './snippet-timeline';

describe('secondsHeard', () => {
  it('is the first snippet alone after one round', () => {
    expect(secondsHeard(1)).toBe(0.1);
  });

  it('accumulates every snippet played so far', () => {
    expect(secondsHeard(2)).toBe(1.1);
    expect(secondsHeard(3)).toBe(3.1);
    expect(secondsHeard(6)).toBe(26.1);
  });

  it('does not run past the last round', () => {
    expect(secondsHeard(9)).toBe(TOTAL_SECONDS);
  });

  it('is nothing before a round is played', () => {
    expect(secondsHeard(0)).toBe(0);
    expect(secondsHeard(-2)).toBe(0);
  });

  it('avoids the float dust that 0.1 + 1 + 2 leaves behind', () => {
    // 0.1 + 1 + 2 is 3.0000000000000004 unrounded.
    expect(String(secondsHeard(3))).toBe('3.1');
  });
});

describe('stepBoundaries', () => {
  it('gives one boundary per round, the last of which is the whole track', () => {
    const boundaries = stepBoundaries();
    expect(boundaries).toHaveLength(SNIPPET_STEPS.length);
    expect(boundaries[boundaries.length - 1]).toBe(1);
  });

  it('rises, and starts near nothing — a first-guess win is barely a sliver', () => {
    const boundaries = stepBoundaries();
    expect(boundaries[0]).toBeLessThan(0.005);
    for (let i = 1; i < boundaries.length; i++) {
      expect(boundaries[i]).toBeGreaterThan(boundaries[i - 1]);
    }
  });
});

describe('formatSeconds', () => {
  it('keeps the tenth that makes 0.1 different from 1', () => {
    expect(formatSeconds(0.1)).toBe('0.1s');
    expect(formatSeconds(1.1)).toBe('1.1s');
  });

  it('drops a trailing zero', () => {
    expect(formatSeconds(3)).toBe('3s');
  });
});
