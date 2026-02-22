/** Named throttler for the guess endpoint */
export const THROTTLE_GUESS = 'guess';
/** Named throttler for the search endpoint */
export const THROTTLE_SEARCH = 'search';

/** Sliding window duration in milliseconds (1 minute) */
export const THROTTLE_TTL = 60_000;

/** Max guesses per minute per session */
export const THROTTLE_GUESS_LIMIT = 20;
/** Max search requests per minute per session */
export const THROTTLE_SEARCH_LIMIT = 60;

/**
 * High default limit for the module-level throttlers.
 * Route-level @Throttle() decorators override this with tighter limits.
 * This ensures non-decorated routes are effectively unthrottled.
 */
export const THROTTLE_DEFAULT_LIMIT = 500;
