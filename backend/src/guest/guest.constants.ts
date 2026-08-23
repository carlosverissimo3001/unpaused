export const GUEST_COOKIE_NAME = 'unpaused_guest';

export const GUEST_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Nothing sweeps abandoned rounds; the TTL is what reclaims them. */
export const GUEST_ROUND_TTL_SECONDS = 60 * 60;

export const GUEST_ROUND_KEY_PREFIX = 'guest:round:';
export const GUEST_SESSION_KEY_PREFIX = 'guest:session:';

/** Unreachable with an app token: every playlist 401s. Replaced in CAR-177. */
export const GUEST_PLAYLIST_IDS: string[] = [
  '37i9dQZEVXbKyJS56d1pgi',
  '37i9dQZEVXbNFJfN1Vw8d9',
  '37i9dQZEVXbLnolsZ8PSNw',
  '37i9dQZEVXbLRQDuF5jeBp',
  '37i9dQZEVXbMDoHDwVN2tF',
];

export const GUEST_PLAYLIST_TRACKS_CACHE_PREFIX = 'guest:playlist_tracks:';
export const GUEST_PLAYLIST_TRACKS_CACHE_TTL = 6 * 60 * 60;

export const GUEST_MAX_PREVIEW_ATTEMPTS = 10;
