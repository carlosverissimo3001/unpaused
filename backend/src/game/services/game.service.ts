import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { startOfDay, differenceInDays } from "date-fns";
import { AuthService } from "@auth/services/auth.service";
import { PlaylistsService } from "@playlists/services/playlists.service";
import { PrismaService } from "@prisma/prisma.service";
import { AppLoggerService } from "../../logger/logger.service";
import { ROUND_DURATIONS, MAX_ROUNDS, GuessResult } from "../consts";
import { LIKED_SONGS_ID_SUFFIX } from "../../consts";
import { GameStatus, Track } from "@prisma/client";
import { TrackService } from "@tracks/services/track.service";
import { TrackDto } from "@tracks/dto/track.dto";
import { TrackRepository } from "@tracks/repositories/track.repository";
import { GuessDto } from "../dto/guess.dto";
import { GameSessionRepository } from "../repositories/game-session.repository";
import { GameStateDto } from "../dto/game-state.dto";
import { normalizeText, normalizeTrackNameForMatch } from "@utils/text";
import { GuessHistoryDto } from "../dto/guess-history.dto";
import { GuessResultDto } from "../dto/guess-result.dto";
import { StartGameDto } from "../dto/start-game.dto";
import {
  GameHistoryDto,
  GameHistoryEntryDto,
} from "../dto/game-history.dto";
import { GetHistoryDto } from "../dto/get-history.dto";
import { ShareResultDto } from "../dto/share-result.dto";
import { DailyStatsDto } from "../dto/daily-stats.dto";
import { GameSessionEntity } from "../entities/game-session.entity";

@Injectable()
export class GameService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly playlistsService: PlaylistsService,
    private readonly trackService: TrackService,
    private readonly trackRepository: TrackRepository,
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    appLogger: AppLoggerService
  ) {
    this.logger = appLogger.child(GameService.name);
  }

  async startGame(sessionId: string, params: StartGameDto): Promise<GameStateDto> {
    const { playlistId: requestedPlaylistId, isDaily } = params;
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    let selectedTrack: TrackDto;
    let previewUrl: string;
    let gamePlaylistId: string;

    if (isDaily) {
      const existingToday = await this.gameSessionRepository.findTodayDailySession(userId);
      if (existingToday) {
        return this.getGameState(existingToday.id);
      }
      const trackInfo = await this.pickLikedTrackWithPreview(sessionId);
      selectedTrack = trackInfo.selectedTrack;
      previewUrl = trackInfo.previewUrl;
      gamePlaylistId = `${userId}-liked-songs`;
    } else {
      if (!requestedPlaylistId) {
        throw new BadRequestException("Playlist ID is required");
      }
      gamePlaylistId = requestedPlaylistId;
      const trackInfo = requestedPlaylistId.endsWith(LIKED_SONGS_ID_SUFFIX)
        ? await this.pickLikedTrackWithPreview(sessionId)
        : await this.pickPlaylistTrackWithPreview(sessionId, requestedPlaylistId);

      selectedTrack = trackInfo.selectedTrack;
      previewUrl = trackInfo.previewUrl;
    }

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
      playlistId: gamePlaylistId,
      isDaily,
      track: { connect: { id: selectedTrack.id } },
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
    });

    return {
      sessionId: game.id,
      currentRound: 0,
      snippetDuration: ROUND_DURATIONS[0],
      status: GameStatus.PLAYING,
      guesses: [],
      previewUrl,
      answer: undefined,
    };
  }

  /** Liked Songs: random offset, fetch 1 track, try until we find one with preview. */
  private async pickLikedTrackWithPreview(
    sessionId: string
  ): Promise<{ selectedTrack: TrackDto; previewUrl: string }> {
    const total = await this.playlistsService.getLikedSongsTotal(sessionId);
    if (!total) {
      throw new BadRequestException("Liked Songs is empty");
    }

    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const offset = Math.floor(Math.random() * total);
      const track = await this.playlistsService.getOneLikedTrackAtOffset(sessionId, offset);
      if (!track?.id) {
        continue;
      }
      try {
        const withPreview = await this.trackService.getTrackWithPreview(track.id, track);
        if (withPreview?.previewUrl) {
          return { selectedTrack: track, previewUrl: withPreview.previewUrl };
        }
      } catch (err) {
        this.logger.warn(`Preview failed for ${track.id}: ${(err as Error).message}`);
      }
    }
    throw new BadRequestException("No tracks with preview audio in Liked Songs.");
  }

  /** Regular playlist: get first batch, shuffle, try until we find one with preview. */
  private async pickPlaylistTrackWithPreview(
    sessionId: string,
    playlistId: string
  ): Promise<{ selectedTrack: TrackDto; previewUrl: string }> {
    const tracks = await this.playlistsService.getPlaylistFirstTracks(sessionId, playlistId);
    if (!tracks.length) {
      throw new BadRequestException("Playlist is empty");
    }
    // This happens if the user added local files to the playlist (or songs that are no longer available on Spotify)
    const playable = tracks.filter((t) => t.id);
    if (!playable.length) {
      throw new BadRequestException("No playable tracks in playlist");
    }

    const shuffled = [...playable].sort(() => Math.random() - 0.5);
    const maxAttempts = Math.min(10, shuffled.length);
    for (let i = 0; i < maxAttempts; i++) {
      const track = shuffled[i];
      try {
        const withPreview = await this.trackService.getTrackWithPreview(track.id, track);
        if (withPreview?.previewUrl) {
          return { selectedTrack: track, previewUrl: withPreview.previewUrl };
        }
      } catch (err) {
        this.logger.warn(`Preview failed for ${track.id}: ${(err as Error).message}`);
      }
    }
    throw new BadRequestException("No tracks with preview audio in this playlist.");
  }

  /**
   * Get current game state
   * @param gameSessionId - The ID of the game session
   */
  async getGameState(gameSessionId: string): Promise<GameStateDto> {
    const game = await this.gameSessionRepository.findById(gameSessionId);

    if (!game) {
      throw new NotFoundException("Game session not found");
    }

    const guesses = game.guesses as unknown as GuessHistoryDto[];

    // Fetch track with relation
    const track = await this.trackRepository.findById(game.trackId);
    if (!track) {
      throw new NotFoundException("Track not found");
    }

    return {
      sessionId: game.id,
      currentRound: game.currentRound,
      snippetDuration:
        ROUND_DURATIONS[Math.min(game.currentRound, MAX_ROUNDS - 1)],
      status: game.status,
      guesses,
      previewUrl: track.previewUrl ?? undefined,
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
    };
  }

  /**
   * Submit a guess
   * @param gameSessionId - The ID of the game session
   * @param params - The guess data
   * @returns The result of the guess
   */
  async submitGuess(gameSessionId: string, params: GuessDto): Promise<GuessResultDto> {
    const game = await this.validateGameSession(gameSessionId);
    const track = await this.trackRepository.findById(game.trackId);

    if (!track) {
      throw new NotFoundException("Active track not found");
    }

    const result = await this.evaluateGuess(params, track);

    const updatedGuesses = this.addGuessToHistory(game, result, track, params);
    // 3. Determine new game state
    const nextRound = game.currentRound + 1;
    const { status, gameOver } = this.calculateNextState(result, nextRound);

    await this.gameSessionRepository.updateSessionProgress(gameSessionId, {
      currentRound: nextRound,
      guesses: updatedGuesses,
      status,
      completedAt: gameOver ? new Date() : undefined,
    });

    if (gameOver && game.isDaily && game.userId) {
      const score = status === GameStatus.WON ? 6 - game.currentRound : 0;
      await this.updateDailyStats(game.userId, status === GameStatus.WON, score);
    }

    return {
      result,
      gameOver,
      status,
      currentRound: nextRound,
      snippetDuration: ROUND_DURATIONS[Math.min(nextRound, MAX_ROUNDS - 1)],
    };
  }

  private async getOrCreateDailyStats(userId: string) {
    let stats = await this.prisma.dailyStats.findUnique({
      where: { userId },
    });
    if (!stats) {
      stats = await this.prisma.dailyStats.create({
        data: { userId },
      });
    }
    return stats;
  }

  private async updateDailyStats(
    userId: string,
    won: boolean,
    score: number
  ): Promise<void> {
    const stats = await this.getOrCreateDailyStats(userId);
    const today = startOfDay(new Date());
    const lastPlayed = stats.lastPlayedAt
      ? startOfDay(stats.lastPlayedAt)
      : null;
    const isConsecutive =
      lastPlayed && differenceInDays(today, lastPlayed) === 1;

    let newStreak: number;
    if (won) {
      newStreak = isConsecutive ? stats.currentStreak + 1 : 1;
    } else {
      newStreak = 0;
    }

    const dist = [...(stats.scoreDistribution ?? [0, 0, 0, 0, 0, 0])];
    if (won && score >= 1 && score <= 6) {
      dist[score - 1] = (dist[score - 1] ?? 0) + 1;
    }

    await this.prisma.dailyStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        lastPlayedAt: today,
        totalGames: { increment: 1 },
        totalWins: won ? { increment: 1 } : undefined,
        totalScore: { increment: score },
        scoreDistribution: dist,
      },
    });
  }

  /**
   * Validates if the game exists and is playable
   * @param id - The ID of the game session
   */
  private async validateGameSession(id: string): Promise<GameSessionEntity> {
    const game = await this.gameSessionRepository.findById(id);
    if (!game) {
      throw new NotFoundException("Game session not found");
    }
    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException("Game is already over");
    }
    return game;
  }

  /**
   * Business Logic: Compares the guess against the actual track.
   * Match on exact trackId OR normalized trackName + artistName (forgiving: Remix/Single etc.).
   */
  private async evaluateGuess(guess: GuessDto, actual: Track): Promise<GuessResult> {
    const { trackId, skip } = guess;

    if (skip || !trackId) {
      return GuessResult.Skip;
    }

    if (trackId === actual.id) {
      return GuessResult.Correct;
    }

    // Forgiving match: same song, different version (e.g. Remix, Single, Live From Paris)
    if (guess.trackName != null && guess.trackName !== "" && guess.artistName != null && guess.artistName !== "") {
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
    guess: GuessDto
  ): GuessHistoryDto[] {
    const history = [...(game.guesses as unknown as GuessHistoryDto[])];

    const trackName =
      result === GuessResult.Correct
        ? actual.name
        : guess.trackName ?? "Unknown";
    const artistName =
      result === GuessResult.Correct
        ? actual.artistName
        : guess.artistName ?? "Unknown";

    history.push({
      trackId: guess.trackId,
      trackName,
      artistName,
      result,
    });

    return history;
  }

  private calculateNextState(result: GuessResult, nextRound: number): { status: GameStatus; gameOver: boolean } {
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
    dto: GetHistoryDto
  ): Promise<GameHistoryDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const { items, total } = await this.gameSessionRepository.findUserGameSessions({
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

    const entries: GameHistoryEntryDto[] = items.map((s) => {
      const track = trackMap.get(s.trackId);
      const dateSource = s.completedAt ?? s.createdAt;
      return {
        id: s.id,
        date: dateSource.toISOString().slice(0, 10),
        status: s.status,
        score: s.score,
        isDaily: s.isDaily,
        guesses: s.guesses,
        trackName: track?.name ?? "",
        artistName: track?.artistName ?? "",
        albumImageUrl: track?.albumImageUrl ?? undefined,
        playlistName: s.isDaily ? "Liked Songs" : undefined,
      };
    });

    return { items: entries, total };
  }

  async getStats(sessionId: string): Promise<DailyStatsDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const stats = await this.getOrCreateDailyStats(userId);

    const totalGames = stats.totalGames || 0;
    const totalWins = stats.totalWins || 0;
    const totalScore = stats.totalScore || 0;

    return {
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? totalWins / totalGames : 0,
      averageScore: totalGames > 0 ? totalScore / totalGames : 0,
      scoreDistribution: stats.scoreDistribution ?? [0, 0, 0, 0, 0, 0],
    };
  }

  async getShare(sessionId: string, gameId: string): Promise<ShareResultDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const game = await this.gameSessionRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException("Game session not found");
    }
    if (game.userId !== userId) {
      throw new NotFoundException("Game session not found");
    }
    if (game.status === GameStatus.PLAYING) {
      throw new BadRequestException("Game not completed");
    }

    const guesses = game.guesses as GuessHistoryDto[];
    const guessPattern = guesses
      .map((g) => {
        if (g.result === GuessResult.Correct) return "🟩";
        if (
          g.result === GuessResult.Artist ||
          g.result === GuessResult.ArtistAndAlbum
        )
          return "🟨";
        if (g.result === GuessResult.Skip) return "⬜";
        return "🟥";
      })
      .join("");

    const dateSource = game.completedAt ?? game.createdAt;
    const gameNum = this.gameNumberFromDate(dateSource);
    const resultEmoji = game.status === GameStatus.WON ? "🎉" : "😢";
    const appUrl = process.env.APP_URL || "https://unpaused.example.com";
    const shareText = `Unpaused Daily #${gameNum} ${resultEmoji}
Score: ${game.score ?? 0}/6

${guessPattern}

Play at: ${appUrl}/daily`;

    const track = await this.trackRepository.findById(game.trackId);

    return {
      date: dateSource.toISOString().slice(0, 10),
      score: game.score ?? 0,
      guessPattern,
      trackName: track?.name ?? "",
      artistName: track?.artistName ?? "",
      shareText,
      gameNumber: gameNum,
    };
  }

  private gameNumberFromDate(date: Date): number {
    const epoch = new Date("2025-01-01");
    return Math.floor(
      (startOfDay(date).getTime() - startOfDay(epoch).getTime()) /
      (24 * 60 * 60 * 1000)
    );
  }
}
