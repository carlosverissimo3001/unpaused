import { JobsOptions } from 'bullmq';

export const SESSION_COOKIE_NAME = 'unpaused_session';
export const TRACK_PREVIEW_CACHE_TTL = 86400; // 24 hours in seconds
export const TRACK_PREVIEW_CACHE_PREFIX = 'track_preview:';
export const LIKED_SONGS_ID_SUFFIX = '-liked-songs';

// Job Constants
export const AGE_TO_KEEP_JOBS = 3 * 24 * 60 * 60; // 3 days in seconds
export const MAX_JOB_HISTORY = 500; // Max number of completed/failed jobs to keep in Redis

// Queues
export const GAME_CLEANUP_QUEUE = 'game-cleanup';

// Jobs
export const CLEAN_UP_ABANDONED_GAMES_JOB = 'abandoned-games-task';
export const JOB_OPTIONS_WITH_BACKOFF: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: {
    age: AGE_TO_KEEP_JOBS,
    count: MAX_JOB_HISTORY,
  },
};

export type JobDataMap = {
  [CLEAN_UP_ABANDONED_GAMES_JOB]: Record<string, never>;
};

export type JobNames = keyof JobDataMap;
