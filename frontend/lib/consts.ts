/** The playlist id a round drawn from the curated pool is started against. */
export const POOL_PLAYLIST_ID = 'pool';

/**
 * Matches the backend's per-address cooldown. Only the countdown on screen:
 * the enforcement is server side, and the server never says it applied.
 */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Matches the backend's MIN_PASSWORD_LENGTH; the server is what enforces it. */
export const MIN_PASSWORD_LENGTH = 8;
