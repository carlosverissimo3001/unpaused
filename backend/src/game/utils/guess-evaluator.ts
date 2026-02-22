import { Track, GameStatus } from '@prisma/client';
import { GuessResult, MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { GuessDto } from '../dto/guess/guess.dto';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { normalizeText, normalizeTrackNameForMatch } from '../../utils/text';

/**
 * Evaluates a guess against the actual track.
 * Match on exact trackId OR normalized trackName + artistName.
 */
export function evaluateGuess(guess: GuessDto, actual: Track): GuessResult {
  const { trackId, skip } = guess;

  if (skip || !trackId) {
    return GuessResult.Skip;
  }

  if (trackId === actual.id) {
    return GuessResult.Correct;
  }

  // Forgiving match: same song, different version
  if (
    guess.trackName != null &&
    guess.trackName !== '' &&
    guess.artistName != null &&
    guess.artistName !== ''
  ) {
    const normName = normalizeTrackNameForMatch(guess.trackName);
    const normArtist = normalizeText(guess.artistName);
    if (
      normName === normalizeTrackNameForMatch(actual.name) &&
      normArtist === normalizeText(actual.artistName)
    ) {
      return GuessResult.Correct;
    }
  }

  const isArtistCorrect =
    guess.artistName != null &&
    normalizeText(guess.artistName).toLowerCase() ===
      normalizeText(actual.artistName).toLowerCase();
  const isAlbumCorrect =
    guess.albumName != null &&
    actual.albumName != null &&
    normalizeText(guess.albumName).toLowerCase() ===
      normalizeText(actual.albumName).toLowerCase();

  let result = GuessResult.Wrong;
  if (isArtistCorrect && isAlbumCorrect) {
    result = GuessResult.ArtistAndAlbum;
  } else if (isArtistCorrect) {
    result = GuessResult.Artist;
  } else if (isAlbumCorrect) {
    result = GuessResult.Album;
  }

  return result;
}

export function addGuessToHistory(
  existingGuesses: GuessHistoryDto[],
  result: GuessResult,
  actual: Track,
  guess: GuessDto,
): GuessHistoryDto[] {
  const history = [...existingGuesses];

  const trackName =
    result === GuessResult.Correct
      ? actual.name
      : (guess.trackName ?? 'Unknown');
  const artistName =
    result === GuessResult.Correct
      ? actual.artistName
      : (guess.artistName ?? 'Unknown');

  history.push({
    trackId: guess.trackId,
    trackName,
    artistName,
    result,
  });

  return history;
}

export function calculateNextState(
  result: GuessResult,
  nextRound: number,
): { status: GameStatus; gameOver: boolean } {
  if (result === GuessResult.Correct) {
    return { status: GameStatus.WON, gameOver: true };
  }

  if (nextRound >= MAX_ROUNDS) {
    return { status: GameStatus.LOST, gameOver: true };
  }

  return { status: GameStatus.PLAYING, gameOver: false };
}

export function getSnippetDuration(round: number): number {
  return ROUND_DURATIONS[Math.min(round, MAX_ROUNDS - 1)];
}
