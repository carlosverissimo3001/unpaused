import { GameStatus, Track } from '@prisma/client';
import { MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { GameStateDto } from '../dto/game-state.dto';
import { GameSessionEntity } from '../entities/game-session.entity';
import { normalizeText } from '../../utils/text';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { GameExtrasVo } from '../vos/game-extras.vo';

export function mapToGameStateDto(
  game: GameSessionEntity,
  track: Track,
  extras?: GameExtrasVo,
): GameStateDto {
  const guesses = game.guesses as unknown as GuessHistoryDto[];

  return {
    sessionId: game.id,
    currentRound: game.currentRound,
    snippetDuration:
      ROUND_DURATIONS[Math.min(game.currentRound, MAX_ROUNDS - 1)],
    status: game.status,
    guesses,
    // Safe to do, we throw on the caller if the track is not found or has no preview URL
    previewUrl: track.previewUrl!,
    answer:
      game.status !== GameStatus.PLAYING
        ? {
            id: track.id,
            name: track.name,
            normalizedName: normalizeText(track.name),
            artist: track.artistName,
            normalizedArtist: normalizeText(track.artistName),
            albumImageUrl: track.albumImageUrl || undefined,
            albumName: track.albumName || undefined,
            albumUrl: track.albumUrl || undefined,
            releaseYear: track.releaseYear || undefined,
          }
        : undefined,
    ...(extras ? extras : {}),
  };
}

export function mapInitialGameState(
  sessionId: string,
  previewUrl: string,
): GameStateDto {
  return {
    sessionId,
    currentRound: 0,
    snippetDuration: ROUND_DURATIONS[0],
    status: GameStatus.PLAYING,
    guesses: [],
    previewUrl,
  };
}
