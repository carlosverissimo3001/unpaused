import { GuessResult } from '../consts';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';

const GUESS_MAPPER: Record<GuessResult, string> = {
  [GuessResult.Correct]: '🟩',
  [GuessResult.Artist]: '🟨',
  [GuessResult.Album]: '🟨',
  [GuessResult.ArtistAndAlbum]: '🟨',
  [GuessResult.Skip]: '⬜',
  [GuessResult.Wrong]: '🟥',
};

/**
 * Converts a guess result to its corresponding emoji for sharing
 */
export function guessToEmoji(result: GuessResult): string {
  return GUESS_MAPPER[result] || '🟥';
}

/**
 * Builds the shareable text for a completed daily game
 */
export function buildShareText(params: {
  gameNumber: number;
  isWin: boolean;
  score: number;
  guesses: GuessHistoryDto[];
  appUrl: string;
}): string {
  const { gameNumber, isWin, score, guesses, appUrl } = params;

  const guessPattern = guesses.map((g) => guessToEmoji(g.result)).join('');
  const resultEmoji = isWin ? '🎉' : '😢';

  return `Unpaused Daily #${gameNumber} ${resultEmoji}
Score: ${score}/6

${guessPattern}

Play at: ${appUrl}/daily`;
}
