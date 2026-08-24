import { JobsOptions } from 'bullmq';

export const SESSION_COOKIE_NAME = 'unpaused_session';
export const TRACK_PREVIEW_CACHE_TTL = 86400; // 24 hours in seconds
export const TRACK_PREVIEW_CACHE_PREFIX = 'track_preview:';
export const LIKED_SONGS_ID_SUFFIX = '-liked-songs';

// Playlist & Spotify caching
export const PLAYLIST_CACHE_PREFIX = 'playlists:';
export const PLAYLIST_META_CACHE_PREFIX = 'playlist_meta:';
export const LIKED_META_CACHE_PREFIX = 'liked_meta:';
export const PLAYLIST_TRACKS_CACHE_PREFIX = 'playlist_tracks:';
export const LIKED_TRACKS_CACHE_PREFIX = 'liked_tracks:';
export const PLAYLIST_TOTAL_TRACKS_PREFIX = 'playlist_total:';
export const PLAYLIST_CACHE_TTL = 5 * 60 * 60; // 5 hours
export const TRACK_BATCH_CACHE_TTL = 5 * 60 * 60;

// Job Constants
export const AGE_TO_KEEP_JOBS = 3 * 24 * 60 * 60; // 3 days in seconds
export const MAX_JOB_HISTORY = 500; // Max number of completed/failed jobs to keep in Redis

// Queues
export const GAME_CLEANUP_QUEUE = 'game-cleanup';
export const DEMO_REFRESH_QUEUE = 'demo-refresh';

// Jobs
export const CLEAN_UP_ABANDONED_GAMES_JOB = 'abandoned-games-task';
export const REFRESH_DEMO_TRACKS_JOB = 'refresh-demo-tracks';
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
  [REFRESH_DEMO_TRACKS_JOB]: Record<string, never>;
};

export type JobNames = keyof JobDataMap;

export const GAME_MAX_ROUNDS = 6;

/** The track pool only changes when it is reseeded, so this can be long. */
export const POOL_CANDIDATE_CACHE_MS = 10 * 60 * 1000;

/** Selection weight multiplies by this for every decade after the pivot. */
export const RECENCY_PER_DECADE = 1.8;
export const RECENCY_PIVOT_YEAR = 2005;

// Track pool — what a player without a Spotify library plays from.
export const POOL_PLAYLIST_ID = 'pool';

/** Unreachable with an app token: every playlist 401s. Replaced in CAR-177. */
export const POOL_PLAYLIST_IDS: string[] = [
  '37i9dQZEVXbKyJS56d1pgi',
  '37i9dQZEVXbNFJfN1Vw8d9',
  '37i9dQZEVXbLnolsZ8PSNw',
  '37i9dQZEVXbLRQDuF5jeBp',
  '37i9dQZEVXbMDoHDwVN2tF',
];

export const POOL_PLAYLIST_TRACKS_CACHE_PREFIX = 'pool:playlist_tracks:';
export const POOL_PLAYLIST_TRACKS_CACHE_TTL = 6 * 60 * 60;

export const POOL_MAX_PREVIEW_ATTEMPTS = 10;
