export const SEARCH_API_URL = 'https://api.deezer.com/search';
export const SEARCH_TIMEOUT_MS = 4000;
/** Over-fetched because variants of one recording collapse into a single option. */
export const SEARCH_FETCH_LIMIT = 25;
export const SEARCH_MAX_OPTIONS = 10;
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_QUERY_LENGTH = 200;
export const SEARCH_CACHE_PREFIX = 'search:';
export const SEARCH_CACHE_TTL_SECONDS = 10 * 60;
