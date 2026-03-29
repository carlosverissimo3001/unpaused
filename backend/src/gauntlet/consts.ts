import { GauntletDifficulty } from '@prisma/client';

/** Snippet duration in seconds per difficulty level */
export const GAUNTLET_SNIPPET_DURATIONS: Record<GauntletDifficulty, number> = {
  [GauntletDifficulty.EASY]: 5,
  [GauntletDifficulty.MEDIUM]: 3,
  [GauntletDifficulty.HARD]: 2,
  [GauntletDifficulty.EXPERT]: 1,
};

/** Number of random playlist batches to sample when picking the next track */
export const GAUNTLET_MAX_SAMPLING_BATCHES = 5;

/** Max candidates to try for a preview URL within a single batch */
export const GAUNTLET_MAX_PREVIEW_ATTEMPTS = 15;
