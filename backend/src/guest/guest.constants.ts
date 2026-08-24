export const GUEST_COOKIE_NAME = 'unpaused_guest';

export const GUEST_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Nothing sweeps abandoned rounds; the TTL is what reclaims them. */
export const GUEST_ROUND_TTL_SECONDS = 60 * 60;

export const GUEST_ROUND_KEY_PREFIX = 'guest:round:';
export const GUEST_SESSION_KEY_PREFIX = 'guest:session:';
