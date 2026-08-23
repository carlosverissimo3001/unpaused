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
