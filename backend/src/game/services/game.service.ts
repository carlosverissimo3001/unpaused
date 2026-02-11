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
import { EMOJIS, GuessResult, MAX_ROUNDS, ROUND_DURATIONS } from '../consts';
import { PlayedTodayDto } from '../dto/daily/played-today.dto';
import { ShareResultDto } from '../dto/daily/share-result.dto';
import { GameHistoryDto, GameHistoryEntryDto } from '../dto/game-history.dto';
import { GameStateDto } from '../dto/game-state.dto';
import { StartGameDto } from '../dto/game/start-game.dto';
import { GetHistoryDto } from '../dto/get-history.dto';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { GuessResultDto } from '../dto/guess/guess-result.dto';
import { GuessDto } from '../dto/guess/guess.dto';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GetStatsDto } from '../dto/stats/get-stats.dto';
import { GameSessionEntity } from '../entities/game-session.entity';
import { GameSessionRepository } from '../repositories/game-session.repository';
import { GameStatsRepository } from '../repositories/game-stats.repository';
import { UpdateGameStatsParams } from '../types';
import {
  mapInitialGameState,
  mapToGameStateDto,
} from '../utils/game-state-mapper';
import { GameExtrasVo, MetaGameExtrasVo } from '../vos/game-extras.vo';
import { gameNumberFromDate } from '../utils/utils';

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
    private readonly gameStatsRepository: GameStatsRepository,
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
      return this.getGameState(existing.id);
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
      if (!playable.length) continue;

      const shuffleInPlace = <T>(array: T[]): void => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
      };

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
   * @param gameSessionId - The ID of the game session
   */
  async getGameState(gameSessionId: string): Promise<GameStateDto> {
    const game = await this.gameSessionRepository.findById(gameSessionId);

    if (!game || !game.userId) {
      throw new NotFoundException('Game session not found');
    }

    // Fetch track with relation
    const track = await this.trackRepository.findById(game.trackId);
    if (!track || !track.previewUrl) {
      throw new NotFoundException('Track not found or no preview URL');
    }

    const user = await this.authService.getUserById(game.userId);

    const extras =
      game.userId != null
        ? this.getUserExtras(
            user.isTrusted,
            game.status !== GameStatus.PLAYING,
            game.status === GameStatus.WON,
          )
        : {};

    return mapToGameStateDto(game, track, extras);
  }

  @Transactional()
  async submitGuess(
    gameSessionId: string,
    params: GuessDto,
  ): Promise<GuessResultDto> {
    const game = await this.validateGameSession(gameSessionId);
    if (!game.userId) {
      throw new NotFoundException('Game session not found');
    }
    const track = await this.trackRepository.findById(game.trackId);

    if (!track) {
      throw new NotFoundException('Active track not found');
    }

    const user = await this.authService.getUserById(game.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = this.evaluateGuess(params, track);

    const updatedGuesses = this.addGuessToHistory(game, result, track, params);
    const nextRound = game.currentRound + 1;
    const { status, gameOver } = this.calculateNextState(result, nextRound);

    if (gameOver && game.userId) {
      await this.updateGameStats({
        userId: game.userId,
        roundWon:
          result === GuessResult.Correct ? game.currentRound : undefined,
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
   * Updates stats for the user. Uses upsert to atomically ensure the
   * stats row exists (avoids race on initial create), then read and update.
   * Must run within a @Transactional() boundary so it participates in the same transaction.
   */
  private async updateGameStats(params: UpdateGameStatsParams): Promise<void> {
    const { userId, roundWon, mode } = params;

    const stats = await this.gameStatsRepository.upsert(userId, GameMode.ALL);
    const dailyStats = await this.gameStatsRepository.upsert(
      userId,
      GameMode.DAILY,
    );

    const newStreak = roundWon ? stats.currentStreak + 1 : 0;
    const newDailyStreak = roundWon ? dailyStats.currentStreak + 1 : 0;

    const dist = [...(stats.roundDistribution ?? [0, 0, 0, 0, 0, 0, 0])];
    const dailyDist = [
      ...(dailyStats.roundDistribution ?? [0, 0, 0, 0, 0, 0, 0]),
    ];

    const index = roundWon ? roundWon : 6; // Failures go to index 6
    dist[index] = (dist[index] ?? 0) + 1;
    dailyDist[index] = (dailyDist[index] ?? 0) + 1;

    await this.gameStatsRepository.update(
      userId,
      {
        currentStreak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        roundDistribution: dist,
        won: !!roundWon,
      },
      GameMode.ALL,
    );

    if (mode === GameMode.DAILY) {
      await this.gameStatsRepository.update(
        userId,
        {
          currentStreak: newDailyStreak,
          bestStreak: Math.max(dailyStats.bestStreak, newDailyStreak),
          roundDistribution: dailyDist,
          won: !!roundWon,
        },
        GameMode.DAILY,
      );
    }
  }

  /**
   * Validates if the game exists and is playable
   * @param id - The ID of the game session
   */
  private async validateGameSession(id: string): Promise<GameSessionEntity> {
    const game = await this.gameSessionRepository.findById(id);
    if (!game) {
      throw new NotFoundException('Game session not found');
    }
    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is already over');
    }
    return game;
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
    const isArtistCorrect = guess.artistName === actual.artistName;
    const isAlbumCorrect = guess.albumName === actual.albumName;

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
    game: GameSessionEntity,
    result: GuessResult,
    actual: Track,
    guess: GuessDto,
  ): GuessHistoryDto[] {
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

  /**
   * Combined extras for a user (personalized lore when game over, meta when win).
   * Keeps getGameState and submitGuess flow simple.
   */
  getUserExtras(
    isTrusted: boolean,
    _isGameOver: boolean,
    isWin: boolean,
  ): GameExtrasVo {
    if (!isTrusted) {
      return {};
    }

    const extras: GameExtrasVo = {};

    /* if (isGameOver) {
      const messages = await this.messageService.findAll();
      const dailyIndex = new Date().getDate() % messages.length;
      const { title, note } = messages[dailyIndex];
      
      extras.rankTitle = title;
      extras.specialNote = note;
    } */

    if (isWin) {
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      extras.meta = new MetaGameExtrasVo(emoji);
    }

    return extras;
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
    const { items, total } =
      await this.gameSessionRepository.findUserGameSessions({
        userId,
        ...dto,
        // In the history tab, we don't care about incomplete games
        onlyCompleted: true,
      });

    const trackIds = [...new Set(items.map((s) => s.trackId))];
    const tracks = await this.prisma.track.findMany({
      where: { id: { in: trackIds } },
    });
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    // Resolve playlist names for non–Liked-Songs playlists (batch by unique ID)
    const playlistIdsToResolve = [
      ...new Set(
        items
          .map((s) => s.playlistId)
          .filter((id) => !id.endsWith(LIKED_SONGS_ID_SUFFIX)),
      ),
    ];
    const playlistNameMap = new Map<string, string>();
    await Promise.all(
      playlistIdsToResolve.map(async (playlistId) => {
        try {
          const playlist = await this.playlistService.getPlaylistById(
            sessionId,
            playlistId,
          );
          playlistNameMap.set(playlistId, playlist.name);
        } catch {
          // Playlist may have been deleted or access revoked; leave name unset
        }
      }),
    );

    const entries: GameHistoryEntryDto[] = items.map((s) => {
      const track = trackMap.get(s.trackId);
      const dateSource = s.completedAt ?? s.createdAt;
      const playlistName = s.playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)
        ? 'Liked Songs'
        : playlistNameMap.get(s.playlistId);
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
        playlistName,
      };
    });

    return { items: entries, total };
  }

  async getStats(
    sessionId: string,
    params: GetStatsDto,
  ): Promise<GameStatsDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const stats = await this.gameStatsRepository.findByUserId(
      userId,
      params.mode,
    );

    return GameStatsDto.fromEntity(stats);
  }

  async getPlayedToday(sessionId: string): Promise<PlayedTodayDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const todaySession =
      await this.gameSessionRepository.findTodayDailySession(userId);
    return { playedToday: !!todaySession };
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
    const guessPattern = guesses
      .map((g) => {
        if (g.result === GuessResult.Correct) return '🟩';
        if (
          g.result === GuessResult.Artist ||
          g.result === GuessResult.ArtistAndAlbum
        )
          return '🟨';
        if (g.result === GuessResult.Skip) return '⬜';
        return '🟥';
      })
      .join('');

    const dateSource = game.completedAt ?? game.createdAt;
    const gameNum = gameNumberFromDate(dateSource);
    const resultEmoji = game.status === GameStatus.WON ? '🎉' : '😢';
    const appUrl = process.env.APP_URL || 'https://unpaused.example.com';
    const shareText = `Unpaused Daily #${gameNum} ${resultEmoji}
Score: ${game.score ?? 0}/6

${guessPattern}

Play at: ${appUrl}/daily`;

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
