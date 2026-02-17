import { AuthService } from '@auth/services/auth.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlaylistService } from '@/playlist/services/playlist.service';
import { GameMode, GameStatus, Track } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { TrackDto } from '@/track/dto/track.dto';
import { TrackRepository } from '@/track/repositories/track.repository';
import { TrackService } from '@/track/services/track.service';
import { Transactional } from '@transaction/transactional.decorator';
import { normalizeText, normalizeTrackNameForMatch } from '@utils/text';
import { formatDate, subHours } from 'date-fns';
import { LIKED_SONGS_ID_SUFFIX } from '../../consts';
import { AppLoggerService } from '../../logger/logger.service';
import { GuessResult, MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { PlayedTodayDto } from '../dto/daily/played-today.dto';
import { ShareResultDto } from '../dto/daily/share-result.dto';
import {
  GameHistoryDto,
  GameHistoryEntryDto,
  StreakFreezeUsageDto,
} from '../dto/game-history.dto';
import { GameStateDto } from '../dto/game-state.dto';
import { StartGameDto } from '../dto/game/start-game.dto';
import { GetHistoryDto } from '../dto/get-history.dto';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { GuessResultDto } from '../dto/guess/guess-result.dto';
import { GuessDto } from '../dto/guess/guess.dto';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GetStatsDto } from '../dto/stats/get-stats.dto';
import { GameSessionRepository } from '../repositories/game-session.repository';
import {
  mapInitialGameState,
  mapToGameStateDto,
} from '../utils/game-state-mapper';
import {
  gameNumberFromDate,
  getUserExtras,
  shuffleInPlace,
} from '../utils/utils';
import { buildShareText, guessToEmoji } from '../utils/share.utils';
import { GameStatsService } from './game-stats.service';
import { AddGuessToHistoryParams } from '../types';

@Injectable()
export class GameService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly trackService: TrackService,
    private readonly trackRepository: TrackRepository,
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly gameStatsService: GameStatsService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(GameService.name);
  }

  @Transactional()
  async startGame(
    sessionId: string,
    params: StartGameDto,
  ): Promise<GameStateDto> {
    const { playlistId, mode } = params;
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const existing =
      mode === GameMode.DAILY
        ? await this.gameSessionRepository.findTodayDailySession(userId)
        : await this.gameSessionRepository.findActiveSession(
            userId,
            mode,
            playlistId,
          );

    // If there's an active session (or already played daily) for this user and mode,
    // return it instead of starting a new one
    if (existing) {
      return this.getGameState(sessionId, existing.id);
    }

    const targetPlaylistId =
      mode === GameMode.DAILY
        ? `${userId}-${LIKED_SONGS_ID_SUFFIX}`
        : playlistId;

    if (!targetPlaylistId) {
      throw new BadRequestException('Playlist ID is required');
    }

    const { selectedTrack, previewUrl } = await this.resolveTrackWithPreview(
      sessionId,
      targetPlaylistId,
    );

    await this.trackRepository.upsertTrack(selectedTrack.id, {
      name: selectedTrack.name,
      artistName: selectedTrack.primaryArtist,
      albumImageUrl: selectedTrack.imageUrl,
      albumName: selectedTrack.albumName,
      albumUrl: `https://open.spotify.com/album/${selectedTrack.albumId}`,
      releaseYear: selectedTrack.releaseYear,
      previewUrl,
    });

    const game = await this.gameSessionRepository.createSession({
      user: { connect: { id: userId } },
      playlistId: targetPlaylistId,
      mode,
      track: { connect: { id: selectedTrack.id } },
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
    });

    return mapInitialGameState(game.id, previewUrl);
  }

  private async resolveTrackWithPreview(sessionId: string, playlistId: string) {
    if (playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)) {
      return this.pickLikedTrackWithPreview(sessionId);
    }
    return this.pickPlaylistTrackWithPreview(sessionId, playlistId);
  }

  /**
   * Liked Songs: batch-first approach.
   * Fetches 50 tracks at a random offset (cached for 5 hours), shuffles, and picks one with preview.
   * Falls back to a second batch if the first yields nothing (very rare).
   */
  private async pickLikedTrackWithPreview(
    sessionId: string,
  ): Promise<{ selectedTrack: TrackDto; previewUrl: string }> {
    const { totalTracks: total } =
      await this.playlistService.getLikedSongsMetadata(sessionId);
    if (!total) {
      throw new BadRequestException('Liked Songs is empty');
    }

    const maxBatches = 2;
    for (let batch = 0; batch < maxBatches; batch++) {
      const batchOffset = Math.floor(Math.random() * Math.max(1, total - 49));
      const tracks = await this.playlistService.getLikedTracksBatch(
        sessionId,
        batchOffset,
      );

      const playable = tracks.filter((t) => t.id);
      if (!playable.length) {
        continue;
      }

      const shuffled = [...playable];
      shuffleInPlace(shuffled);
      const maxAttempts = Math.min(10, shuffled.length);

      for (let i = 0; i < maxAttempts; i++) {
        const track = shuffled[i];
        try {
          const withPreview = await this.trackService.getTrackWithPreview(
            track.id,
            track,
          );
          if (withPreview?.previewUrl) {
            return { selectedTrack: track, previewUrl: withPreview.previewUrl };
          }
        } catch (err) {
          this.logger.warn(
            `Preview failed for ${track.id}: ${(err as Error).message}`,
          );
        }
      }
    }

    throw new BadRequestException(
      'No tracks with preview audio in Liked Songs.',
    );
  }

  /** Regular playlist: get first batch, shuffle, try until we find one with preview. */
  private async pickPlaylistTrackWithPreview(
    sessionId: string,
    playlistId: string,
  ): Promise<{ selectedTrack: TrackDto; previewUrl: string }> {
    const tracks = await this.playlistService.getPlaylistFirstTracks(
      sessionId,
      playlistId,
    );
    if (!tracks.length) {
      throw new BadRequestException('Playlist is empty');
    }
    // This happens if the user added local files to the playlist (or songs that are no longer available on Spotify)
    const playable = tracks.filter((t) => t.id);
    if (!playable.length) {
      throw new BadRequestException('No playable tracks in playlist');
    }

    const shuffled = [...playable].sort(() => Math.random() - 0.5);
    const maxAttempts = Math.min(10, shuffled.length);
    for (let i = 0; i < maxAttempts; i++) {
      const track = shuffled[i];
      try {
        const withPreview = await this.trackService.getTrackWithPreview(
          track.id,
          track,
        );
        if (withPreview?.previewUrl) {
          return { selectedTrack: track, previewUrl: withPreview.previewUrl };
        }
      } catch (err) {
        this.logger.warn(
          `Preview failed for ${track.id}: ${(err as Error).message}`,
        );
      }
    }
    throw new BadRequestException(
      'No tracks with preview audio in this playlist.',
    );
  }

  /**
   * Get current game state
   * @param sessionId - The session ID of the requesting user
   * @param gameSessionId - The ID of the game session
   */
  async getGameState(
    sessionId: string,
    gameSessionId: string,
  ): Promise<GameStateDto> {
    const [user, gameWithTrack] = await Promise.all([
      this.authService.getUserBySessionId(sessionId),
      this.gameSessionRepository.findByIdWithTrack(gameSessionId),
    ]);

    if (!gameWithTrack || !gameWithTrack.game.userId) {
      throw new NotFoundException('Game session not found');
    }

    const { game, track } = gameWithTrack;

    if (game.userId !== user.id) {
      throw new NotFoundException('Game session not found');
    }

    // Should not happen since we only start games with valid tracks, but just in case
    if (!track.previewUrl) {
      throw new NotFoundException('Track not found or no preview URL');
    }

    const extras = getUserExtras(
      user.isTrusted,
      game.status === GameStatus.WON,
    );

    return mapToGameStateDto(game, track, extras);
  }

  @Transactional()
  async submitGuess(
    sessionId: string,
    gameSessionId: string,
    guess: GuessDto,
  ): Promise<GuessResultDto> {
    const [user, gameWithTrack] = await Promise.all([
      this.authService.getUserBySessionId(sessionId),
      this.gameSessionRepository.findByIdWithTrack(gameSessionId),
    ]);

    if (!gameWithTrack || !gameWithTrack.game.userId) {
      throw new NotFoundException('Game session not found');
    }

    const { game, track: actual } = gameWithTrack;

    if (game.userId !== user.id) {
      throw new NotFoundException('Game session not found');
    }

    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is already over');
    }

    const result = this.evaluateGuess(guess, actual);

    const updatedGuesses = this.addGuessToHistory({
      game,
      result,
      actual,
      guess,
    });
    const nextRound = game.currentRound + 1;
    const { status, gameOver } = this.calculateNextState(result, nextRound);

    if (gameOver && game.userId) {
      await this.gameStatsService.updateGameStats({
        userId: game.userId,
        roundWon:
          result === GuessResult.Correct ? game.currentRound : nextRound,
        mode: game.mode,
      });
    }

    await this.gameSessionRepository.updateSessionProgress(gameSessionId, {
      currentRound: nextRound,
      guesses: updatedGuesses,
      status,
      completedAt: gameOver ? new Date() : undefined,
    });

    return {
      result,
      gameOver,
      status,
      currentRound: nextRound,
      snippetDuration: ROUND_DURATIONS[Math.min(nextRound, MAX_ROUNDS - 1)],
    };
  }

  /**
   * Business Logic: Compares the guess against the actual track.
   * Match on exact trackId OR normalized trackName + artistName (forgiving: Remix/Single etc.).
   */
  private evaluateGuess(guess: GuessDto, actual: Track): GuessResult {
    const { trackId, skip } = guess;

    if (skip || !trackId) {
      return GuessResult.Skip;
    }

    if (trackId === actual.id) {
      return GuessResult.Correct;
    }

    // Forgiving match: same song, different version (e.g. Remix, Single, Live From Paris)
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

  private addGuessToHistory(
    params: AddGuessToHistoryParams,
  ): GuessHistoryDto[] {
    const { game, result, actual, guess } = params;
    const history = [...(game.guesses as unknown as GuessHistoryDto[])];

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

  private calculateNextState(
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

  async getHistory(
    sessionId: string,
    dto: GetHistoryDto,
  ): Promise<GameHistoryDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const limit = dto.limit ?? 10;
    const page = dto.page ?? 1;

    const { items, total } =
      await this.gameSessionRepository.findUserGameSessions({
        userId,
        ...dto,
        limit,
        page,
        // In the history tab, we don't care about incomplete games
        onlyCompleted: true,
      });

    const trackIds = [...new Set(items.map((s) => s.trackId))];
    const tracks = await this.trackRepository.findMany(trackIds);
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    const entries: GameHistoryEntryDto[] = items.map((s) => {
      const track = trackMap.get(s.trackId);
      const dateSource = s.completedAt ?? s.createdAt;
      return {
        id: s.id,
        date: formatDate(dateSource, 'yyyy-MM-dd'),
        status: s.status,
        score: s.score,
        mode: s.mode,
        guesses: s.guesses,
        trackName: track?.name ?? '',
        artistName: track?.artistName ?? '',
        albumImageUrl: track?.albumImageUrl ?? undefined,
      };
    });

    // For DAILY mode, include streak freeze usages scoped to the page date range
    let streakFreezeUsages: StreakFreezeUsageDto[] | undefined;
    if (dto.mode === GameMode.DAILY && entries.length > 0) {
      const pageDates = entries.map((e) => e.date);
      const oldestDate = pageDates[pageDates.length - 1]; // sorted desc, last = oldest
      const newestDate = pageDates[0];

      // TODO: move to StreakService, create a repo there
      const usages = await this.prisma.streakFreezeUsage.findMany({
        where: {
          userId,
          coveredFrom: { gte: new Date(oldestDate) },
          coveredTo: { lte: new Date(newestDate + 'T23:59:59.999Z') },
        },
        orderBy: { createdAt: 'desc' },
      });
      streakFreezeUsages = usages.map((u) => ({
        id: u.id,
        coveredFrom: formatDate(u.coveredFrom, 'yyyy-MM-dd'),
        coveredTo: formatDate(u.coveredTo, 'yyyy-MM-dd'),
        freezesUsed: u.freezesUsed,
        gapDays: u.gapDays,
        streakAtTime: u.streakAtTime,
      }));
    }

    const totalPages = Math.ceil(total / limit);

    return {
      items: entries,
      meta: {
        totalItems: total,
        itemCount: entries.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
      streakFreezeUsages,
    };
  }

  async getStats(
    sessionId: string,
    params: GetStatsDto,
  ): Promise<GameStatsDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    return this.gameStatsService.getStats(userId, params.mode);
  }

  async getPlayedToday(sessionId: string): Promise<PlayedTodayDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const todaySession =
      await this.gameSessionRepository.findTodayDailySession(userId);
    return { playedToday: !!todaySession?.completedAt };
  }

  async getShare(sessionId: string, gameId: string): Promise<ShareResultDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const game = await this.gameSessionRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game session not found');
    }
    if (game.userId !== userId) {
      throw new NotFoundException('Game session not found');
    }
    if (game.status === GameStatus.PLAYING) {
      throw new BadRequestException('Game not completed');
    }

    const guesses = game.guesses;
    const guessPattern = guesses.map((g) => guessToEmoji(g.result)).join('');

    const dateSource = game.completedAt ?? game.createdAt;
    const gameNum = gameNumberFromDate(dateSource);
    const appUrl = process.env.APP_URL || 'https://unpaused.example.com';
    const shareText = buildShareText({
      gameNumber: gameNum,
      isWin: game.status === GameStatus.WON,
      score: game.score ?? 0,
      guesses,
      appUrl,
    });

    const track = await this.trackRepository.findById(game.trackId);

    return {
      date: dateSource.toISOString().slice(0, 10),
      score: game.score ?? 0,
      guessPattern,
      trackName: track?.name ?? '',
      artistName: track?.artistName ?? '',
      shareText,
      gameNumber: gameNum,
    };
  }

  /**
   * Marks games as abandoned if they've been in PLAYING state for over an hour, to keep the system clean of forgotten sessions.
   * This is triggered by a scheduled job in GameConsumer.
   * Daily games should be ignored
   * @returns
   */
  async cleanupAbandonedGames(): Promise<number> {
    const oneHourAgo = subHours(new Date(), 1);

    const games = await this.gameSessionRepository.updateMany(
      {
        status: GameStatus.PLAYING,
        createdAt: { lt: oneHourAgo },
        mode: { not: GameMode.DAILY },
      },
      {
        status: GameStatus.ABANDONED,
      },
    );

    return games;
  }
}
