/**
 * Public, unauthenticated play for visitors who haven't logged in with
 * Spotify. Exists because Spotify's Development Mode caps OAuth-authorized
 * users at 5 (see CAR-176) - guest play routes around that cap entirely by
 * using the Client Credentials grant (app-only, no per-user consent) instead
 * of the PKCE login flow the rest of the app uses.
 *
 * Round state lives in Redis with a TTL, not Postgres: there's no User row
 * to attach a GameSession to, and guest play isn't meant to be durable.
 */

export const GUEST_COOKIE_NAME = 'unpaused_guest';

/** How long a guest identity cookie/Redis entry lives. Refreshed on each use. */
export const GUEST_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/** Generous relative to the real game's 1h abandon window: no cleanup job
 * exists for guest rounds, so the TTL alone is what reclaims them. */
export const GUEST_ROUND_TTL_SECONDS = 60 * 60; // 1 hour

export const GUEST_ROUND_KEY_PREFIX = 'guest:round:';
export const GUEST_SESSION_KEY_PREFIX = 'guest:session:';

/**
 * Curated public playlists guests draw tracks from - the same editorial
 * charts the carlosverissimo.com demo uses (see demo.constants.ts). Picking
 * the actual pool composition (variety, refresh cadence) is tracked
 * separately (CAR-177); this is a working seed list so guest play functions
 * end-to-end in the meantime.
 */
export const GUEST_PLAYLIST_IDS: string[] = [
  '37i9dQZEVXbKyJS56d1pgi', // Top 50 Portugal
  '37i9dQZEVXbNFJfN1Vw8d9', // Top 50 Spain
  '37i9dQZEVXbLnolsZ8PSNw', // Top 50 UK
  '37i9dQZEVXbLRQDuF5jeBp', // Top 50 USA
  '37i9dQZEVXbMDoHDwVN2tF', // Top 50 Global
];

/** Shared across all guests (app-token data, not per-user), so a much
 * shorter TTL than the per-user playlist cache is fine. */
export const GUEST_PLAYLIST_TRACKS_CACHE_PREFIX = 'guest:playlist_tracks:';
export const GUEST_PLAYLIST_TRACKS_CACHE_TTL = 6 * 60 * 60; // 6 hours

/** Max preview-resolve attempts when picking a track from the pool. */
export const GUEST_MAX_PREVIEW_ATTEMPTS = 10;
