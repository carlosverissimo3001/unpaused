/**
 * Public, unauthenticated demo used by carlosverissimo.com.
 *
 * Isolated from the real game on purpose: no session, no cookie, no Spotify
 * OAuth, no user library. The portfolio is a different origin, so a session
 * cookie there would be a third-party cookie. Rounds are keyed by an opaque id
 * returned in the response body instead.
 */

export type DemoTrack = {
  id: string;
  name: string;
  artistName: string;
  albumImageUrl: string;
  previewUrl: string;
};

export type DemoPlaylist = {
  /** Stable key used by the API and the client. */
  slug: string;
  name: string;
  /** Spotify's editorial chart playlist. These ids are long-lived. */
  playlistId: string;
};

export const DEMO_PLAYLISTS: DemoPlaylist[] = [
  { slug: 'pt', name: 'Top 50 Portugal', playlistId: '37i9dQZEVXbKyJS56d1pgi' },
  { slug: 'es', name: 'Top 50 Spain', playlistId: '37i9dQZEVXbNFJfN1Vw8d9' },
  { slug: 'uk', name: 'Top 50 UK', playlistId: '37i9dQZEVXbLnolsZ8PSNw' },
  { slug: 'us', name: 'Top 50 USA', playlistId: '37i9dQZEVXbLRQDuF5jeBp' },
  {
    slug: 'global',
    name: 'Top 50 Global',
    playlistId: '37i9dQZEVXbMDoHDwVN2tF',
  },
];

export const DEMO_OPTION_COUNT = 4;

/**
 * Seconds of audio unlocked per attempt, one step per option.
 *
 * The count has to match DEMO_OPTION_COUNT: with four options a player can be
 * wrong at most three times before the last one is forced, so any further
 * steps are unreachable and the attempt counter would promise rounds that
 * cannot happen. The durations are more generous than the real game's
 * ROUND_DURATIONS, since demo players are guessing against a chart they may
 * not know rather than their own library.
 */
export const DEMO_SNIPPET_STEPS = [1, 2, 4, 8];

export const DEMO_ROUND_PREFIX = 'demo:round:';

/** The daily refresh, and the date its job id is scoped to, share this. */
export const DEMO_REFRESH_CRON = '0 8 * * *';
export const DEMO_REFRESH_TZ = 'Europe/Lisbon';

/** Long enough to finish a round, short enough that abandoned ones evaporate. */
export const DEMO_ROUND_TTL_SECONDS = 900;
