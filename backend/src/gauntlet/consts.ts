import { GauntletDifficulty } from '@prisma/client';
import { ROUND_DURATIONS } from '../game/consts';

/**
 * Rungs of the game's own ladder, so a length here means what it means
 * anywhere else in the app.
 *
 * The two ends are left out on purpose. A tenth of a second is round one of a
 * game with five chances behind it; here one miss ends the run, so it would be
 * a coin flip rather than a difficulty. And twelve seconds is nobody's idea of
 * a speed run.
 */
export const GAUNTLET_SNIPPET_DURATIONS: Record<GauntletDifficulty, number> = {
  [GauntletDifficulty.EASY]: ROUND_DURATIONS[4],
  [GauntletDifficulty.MEDIUM]: ROUND_DURATIONS[3],
  [GauntletDifficulty.HARD]: ROUND_DURATIONS[2],
  [GauntletDifficulty.EXPERT]: ROUND_DURATIONS[1],
};

/** Number of random playlist batches to sample when picking the next track */
export const GAUNTLET_MAX_SAMPLING_BATCHES = 5;

/** Max candidates to try for a preview URL within a single batch */
export const GAUNTLET_MAX_PREVIEW_ATTEMPTS = 15;
