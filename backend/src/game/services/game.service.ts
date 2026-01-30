import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "@auth/services/auth.service";
import { PlaylistsService } from "@playlists/services/playlists.service";
import { AppLoggerService } from "../../logger/logger.service";
import { ROUND_DURATIONS, MAX_ROUNDS, GuessResult } from "../consts";
import { LIKED_SONGS_ID_SUFFIX } from "../../consts";
import { GameSession, GameStatus, Track } from "@prisma/client";
import { TrackService } from "@tracks/services/track.service";
import { TrackDto } from "@tracks/dto/track.dto";
import { TrackRepository } from "@tracks/repositories/track.repository";
import { GuessDto } from "../dto/guess.dto";
import { GameSessionRepository } from "../repositories/game-session.repository";
import { GameStateDto } from "../dto/game-state.dto";
import { normalizeText, normalizeTrackNameForMatch } from "@utils/text";
import { GuessHistoryDto } from "../dto/guess-history.dto";
import { GuessResultDto } from "../dto/guess-result.dto";

@Injectable()
export class GameService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly playlistsService: PlaylistsService,
    private readonly trackService: TrackService,
    private readonly trackRepository: TrackRepository,
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly authService: AuthService,
    appLogger: AppLoggerService
  ) {
    this.logger = appLogger.child(GameService.name);
  }

  async startGame(sessionId: string, playlistId: string): Promise<GameStateDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const { selectedTrack, previewUrl } = playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)
      ? await this.pickLikedTrackWithPreview(sessionId)
      : await this.pickPlaylistTrackWithPreview(sessionId, playlistId);

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
      playlistId,
      isDaily: false,
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

    return {
      result,
      gameOver,
      status,
      currentRound: nextRound,
      snippetDuration: ROUND_DURATIONS[Math.min(nextRound, MAX_ROUNDS - 1)],
    };
  }

  /**
   * Validates if the game exists and is playable
   * @param id - The ID of the game session
   */
  private async validateGameSession(id: string): Promise<GameSession> {
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
    game: GameSession,
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
}
