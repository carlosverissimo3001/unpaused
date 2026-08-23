import { GameStatus } from '@prisma/client';
import { Image } from '@spotify/web-api-ts-sdk';
import { getYear } from 'date-fns';

/**
 * Get the first image from a list of images
 * @param images - The list of images
 * @returns The first image URL
 */
export const getFirstImage = (images: Image[]): string =>
  images?.[0]?.url || '';

// TODO: Double check what Spotify returns here
export const getTrackReleaseYear = (
  releaseDate: string,
  datePrecision: string,
): number | undefined => {
  if (datePrecision === 'year') {
    return parseInt(releaseDate, 10);
  } else if (datePrecision === 'month' || datePrecision === 'day') {
    return getYear(new Date(releaseDate));
  }
  return undefined;
};

export function computeScore(
  status: GameStatus,
  currentRound: number,
): number | undefined {
  if (status === GameStatus.WON) {
    // Guessed on 6th round -> score = 1, guessed on 1st round -> score = 6
    return 6 - currentRound + 1;
  } else if (status === GameStatus.LOST) {
    return 0;
  }
  return undefined;
}

/**
 * Track ids are namespaced by catalogue: bare ids come from Spotify, `dz:`
 * ones from the guest pool. Callers must not build these URLs themselves —
 * the reveal card used to concatenate the id into a Spotify URL, which turns a
 * pool track into a link that renders fine and 404s on click.
 */
export const catalogueTrackUrl = (id: string): string =>
  id.startsWith('dz:')
    ? `https://www.deezer.com/track/${id.slice(3)}`
    : `https://open.spotify.com/track/${id}`;
