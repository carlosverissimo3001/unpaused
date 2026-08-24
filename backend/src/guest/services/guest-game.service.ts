import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GameMode, GameStatus } from '@prisma/client';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackService } from '../../track/services/track.service';
import { GameSessionEntity } from '../../game/entities/game-session.entity';
import { GuessDto } from '../../game/dto/guess/guess.dto';
import { GuessResultDto } from '../../game/dto/guess/guess-result.dto';
import { GameStateDto } from '../../game/dto/game-state.dto';
import { MAX_ROUNDS, ROUND_DURATIONS } from '../../game/consts';
import {
  addGuessToHistory,
  calculateNextState,
  evaluateGuess,
} from '../../game/utils/guess-evaluator';
import { buildHintsForRound } from '../../game/utils/hint-builder';
import {
  mapInitialGameState,
  mapToGameStateDto,
} from '../../game/utils/game-state-mapper';
import { PoolService } from '../../pool/services/pool.service';
import { TrackEntity } from '../../track/entities/track.entity';
import {
  GUEST_ROUND_KEY_PREFIX,
  GUEST_ROUND_TTL_SECONDS,
} from '../guest.constants';
import { POOL_MAX_PREVIEW_ATTEMPTS } from '../../consts';

const GUEST_PLAYLIST_ID = 'guest-pool';

/**
 * Guest equivalent of GameService, for visitors without a Spotify login.
 *
 * Deliberately reuses the same round-scoring engine as the authenticated
 * game (evaluateGuess/addGuessToHistory/calculateNextState/buildHintsForRound
 * and the game-state-mapper functions) rather than reimplementing any of it -
 * that logic doesn't care where the session state lives. What differs is
 * genuinely different for a guest: no Postgres row (there's no User to
 * attach a GameSession to), no stats/streak side effects, and tracks come
 * from a curated public pool instead of the player's own Spotify library.
 */
@Injectable()
export class GuestGameService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    private readonly trackService: TrackService,
    private readonly poolService: PoolService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(GuestGameService.name);
  }

  async startGame(guestId: string): Promise<GameStateDto> {
    const { track, previewUrl } = await this.pickTrackWithPreview();

    const roundId = uuidv4();
    const state: GameSessionEntity = {
      id: roundId,
      userId: guestId,
      playlistId: GUEST_PLAYLIST_ID,
      mode: GameMode.ALL,
      trackId: track.id,
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
      createdAt: new Date(),
    };

    await this.save(roundId, state);
    return mapInitialGameState(roundId, previewUrl);
  }

  async getGameState(guestId: string, roundId: string): Promise<GameStateDto> {
    const state = await this.loadOwned(guestId, roundId);
    const track = await this.trackService.findById(state.trackId);
    if (!track) {
      throw new NotFoundException('Associated track not found');
    }
    // Stored preview urls expire, so resume re-mints rather than replaying one.
    const previewUrl = await this.trackService.resolvePreview(track);
    if (!previewUrl) {
      throw new NotFoundException('Track not found or no preview URL');
    }
    return mapToGameStateDto(state, { ...track, previewUrl });
  }

  async submitGuess(
    guestId: string,
    roundId: string,
    guess: GuessDto,
  ): Promise<GuessResultDto> {
    const state = await this.loadOwned(guestId, roundId);

    if (state.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is already over');
    }

    const track = await this.trackService.findById(state.trackId);
    if (!track) {
      throw new NotFoundException('Associated track not found');
    }

    const result = evaluateGuess(guess, track);
    const updatedGuesses = addGuessToHistory(
      state.guesses,
      result,
      track,
      guess,
    );
    const nextRound = state.currentRound + 1;
    const { status, gameOver } = calculateNextState(result, nextRound);

    const updated: GameSessionEntity = {
      ...state,
      currentRound: nextRound,
      guesses: updatedGuesses,
      status,
      completedAt: gameOver ? new Date() : undefined,
    };
    await this.save(roundId, updated);

    const hints = !gameOver ? buildHintsForRound(track, nextRound) : undefined;

    return {
      result,
      gameOver,
      status,
      currentRound: nextRound,
      snippetDuration: ROUND_DURATIONS[Math.min(nextRound, MAX_ROUNDS - 1)],
      maxRounds: MAX_ROUNDS,
      hints,
    };
  }

  /**
   * Draws from the curated pool, weighted toward better-known songs.
   *
   * Pool rows carry no preview: Deezer's links expire within minutes, so audio
   * is resolved per round. A track that resolves to nothing is set aside and
   * another drawn, rather than failing the round.
   */
  private async pickTrackWithPreview(): Promise<{
    track: TrackEntity;
    previewUrl: string;
  }> {
    const tried: string[] = [];

    for (let i = 0; i < POOL_MAX_PREVIEW_ATTEMPTS; i++) {
      const track = await this.poolService.pickTrack(tried);
      try {
        const previewUrl = await this.trackService.resolvePreview(track);
        if (previewUrl) {
          return { track, previewUrl };
        }
      } catch (err) {
        this.logger.warn(
          `Preview failed for ${track.id}: ${(err as Error).message}`,
        );
      }
      tried.push(track.id);
    }

    throw new BadRequestException(
      'No tracks with preview audio in the guest pool right now.',
    );
  }

  private async loadOwned(
    guestId: string,
    roundId: string,
  ): Promise<GameSessionEntity> {
    const state = await this.load(roundId);
    if (state.userId !== guestId) {
      // Same response as "not found" - don't reveal whether the round exists.
      throw new NotFoundException('Game session not found');
    }
    return state;
  }

  private async save(roundId: string, state: GameSessionEntity): Promise<void> {
    await this.redis.set(
      `${GUEST_ROUND_KEY_PREFIX}${roundId}`,
      JSON.stringify(state),
      GUEST_ROUND_TTL_SECONDS,
    );
  }

  private async load(roundId: string): Promise<GameSessionEntity> {
    const raw = await this.redis.get(`${GUEST_ROUND_KEY_PREFIX}${roundId}`);
    if (!raw) {
      throw new NotFoundException('Game session not found');
    }
    try {
      const parsed = JSON.parse(raw) as GameSessionEntity;
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        completedAt: parsed.completedAt
          ? new Date(parsed.completedAt)
          : undefined,
      };
    } catch {
      throw new NotFoundException('Game session state is corrupted');
    }
  }
}
