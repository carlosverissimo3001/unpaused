/** Game constants */
export enum GuessResult {
  Correct = 'CORRECT',
  Artist = 'ARTIST',
  Album = 'ALBUM',
  Wrong = 'WRONG',
  Skip = 'SKIP',
  ArtistAndAlbum = 'ARTIST_AND_ALBUM',
}
export const ROUND_DURATIONS = [0.5, 1, 2, 4, 8, 10];
export const MAX_ROUNDS = ROUND_DURATIONS.length;
export const GAME_HISTORY_DEFAULT_PAGE_SIZE = 10;

/** Search constants */
export const SEARCH_API_URL = 'https://api.deezer.com/search';
export const SEARCH_TIMEOUT_MS = 4000;
/** Over-fetched because variants of one recording collapse into a single option. */
export const SEARCH_FETCH_LIMIT = 25;
export const SEARCH_MAX_OPTIONS = 10;
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_QUERY_LENGTH = 200;
export const SEARCH_CACHE_PREFIX = 'search:';
export const SEARCH_CACHE_TTL_SECONDS = 10 * 60;
