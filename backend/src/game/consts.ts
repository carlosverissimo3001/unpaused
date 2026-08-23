/** Game constants */
export enum GuessResult {
  Correct = 'CORRECT',
  Artist = 'ARTIST',
  Album = 'ALBUM',
  Wrong = 'WRONG',
  Skip = 'SKIP',
  ArtistAndAlbum = 'ARTIST_AND_ALBUM',
}
/**
 * The first round was 0.5s only because an <audio> element could not reliably
 * make a sound in less. Web Audio schedules the exact length, so 0.1s is real.
 */
export const ROUND_DURATIONS = [0.1, 1, 2, 4, 8, 10];
export const MAX_ROUNDS = ROUND_DURATIONS.length;
export const GAME_HISTORY_DEFAULT_PAGE_SIZE = 10;
