/** Named throttler for the guess endpoint */
export const THROTTLE_GUESS = 'guess';
/** Named throttler for the search endpoint */
export const THROTTLE_SEARCH = 'search';
/** Named throttler for the public demo endpoints */
export const THROTTLE_DEMO = 'demo';

/** Sliding window duration in milliseconds (1 minute) */
export const THROTTLE_TTL = 60_000;

/** Max guesses per minute per session */
export const THROTTLE_GUESS_LIMIT = 20;
/** Max search requests per minute per session */
export const THROTTLE_SEARCH_LIMIT = 60;

/**
 * Per IP, not per session: the demo endpoints are public, so there is no
 * session to key on. One limit covers the controller; both routes are a DB
 * read plus a Redis write against a fixed pool.
 */
export const THROTTLE_DEMO_LIMIT = 60;

/**
 * High default limit for the module-level throttlers.
 * Route-level @Throttle() decorators override this with tighter limits.
 * This ensures non-decorated routes are effectively unthrottled.
 */
export const THROTTLE_DEFAULT_LIMIT = 500;

/** Named throttler for the public guest game endpoints */
export const THROTTLE_GUEST = 'guest';
/**
 * Per IP, same reasoning as the demo endpoints: guests have no session to key
 * on. The pool read is cheap, but a round still resolves preview audio.
 */
export const THROTTLE_GUEST_LIMIT = 40;
