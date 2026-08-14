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

/** Seconds of audio unlocked per attempt, matching the real game. */
export const DEMO_SNIPPET_STEPS = [1, 2, 4, 7, 11, 16];

export const DEMO_OPTION_COUNT = 4;

export const DEMO_ROUND_PREFIX = 'demo:round:';
export const DEMO_PLAYLIST_PREFIX = 'demo:playlist:';

/** Long enough to finish a round, short enough that abandoned ones evaporate. */
export const DEMO_ROUND_TTL_SECONDS = 900;

/** Charts move slowly; one fetch a day per playlist is plenty. */
export const DEMO_PLAYLIST_TTL_SECONDS = 86_400;
