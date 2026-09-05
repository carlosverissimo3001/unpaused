import { GauntletDifficulty } from '@prisma/client';
import { GAUNTLET_SNIPPET_DURATIONS } from './consts';
import { ROUND_DURATIONS } from '../game/consts';

describe('GAUNTLET_SNIPPET_DURATIONS', () => {
  const durations = Object.values(GauntletDifficulty).map(
    (difficulty) => GAUNTLET_SNIPPET_DURATIONS[difficulty],
  );

  it('only offers lengths the game already uses', () => {
    for (const seconds of durations) {
      expect(ROUND_DURATIONS).toContain(seconds);
    }
  });

  it('gets harder from easy to expert', () => {
    expect(durations).toEqual([...durations].sort((a, b) => b - a));
  });

  it('leaves out the tenth of a second, which is a coin flip with one chance', () => {
    expect(durations).not.toContain(ROUND_DURATIONS[0]);
  });
});
