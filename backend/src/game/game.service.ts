import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { AuthService } from "@auth/services/auth.service";
import { PlaylistsService } from "@playlists/services/playlists.service";
import {
  ROUND_DURATIONS,
  MAX_ROUNDS,
  GameStateDto,
  GuessResultDto,
  TrackOptionDto,
  GuessHistoryDto,
} from "@game/dto/game.dto";
import { GameStatus } from "@prisma/client";
import { TrackService } from "@tracks/services/track.service";
import { TrackDto } from "../playlists/dto/track.dto";
import { GuessDto } from "./dto/game.dto";
import { GameSessionRepository } from "./repositories/game-session.repository";
import { GuessResult } from "./consts";

@Injectable()
export class GameService {
  constructor(
    private readonly playlistsService: PlaylistsService,
    private readonly trackService: TrackService,
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger(GameService.name);

  async startGame(sessionId: string, playlistId: string): Promise<GameStateDto> {
    // 1. Resolve User
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    // 2. Fetch & Validate Playlist
    const playlist = await this.playlistsService.getPlaylistById(sessionId || "", playlistId);
    if (!playlist || !playlist.tracks?.length) {
      throw new BadRequestException("Playlist is empty or not found");
    }

    // 3. Selection Logic (Try to find a playable track)
    const { selectedTrack, previewUrl } = await this.selectPlayableTrack(playlist.tracks);

    // 4. Persistence
    const game = await this.gameSessionRepository.createSession({
      user: { connect: { id: userId } },
      playlistId,
      isDaily: false,
      trackId: selectedTrack.id,
      trackName: selectedTrack.name,
      artistName: selectedTrack.primaryArtist,
      albumImageUrl: selectedTrack.imageUrl,
      previewUrl: previewUrl,
      currentRound: 0,
      guesses: [],
      status: GameStatus.PLAYING,
    });

    // 5. Map Options for Frontend
    const trackOptions: TrackOptionDto[] = playlist.tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.primaryArtist,
    }));

    return {
      sessionId: game.id,
      currentRound: 0,
      snippetDuration: ROUND_DURATIONS[0],
      status: GameStatus.PLAYING,
      guesses: [],
      previewUrl: game.previewUrl ?? undefined,
      trackOptions,
      answer: null,
    };
  }


  /**
   * Helper: Shuffle and find a track with a preview
   */
  private async selectPlayableTrack(tracks: TrackDto[]): Promise<{ selectedTrack: TrackDto, previewUrl: string }> {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const maxAttempts = Math.min(10, shuffled.length);

    for (let i = 0; i < maxAttempts; i++) {
      const track = shuffled[i];
      try {
        const trackWithPreview = await this.trackService.getTrackWithPreview(track.id, track);
        if (trackWithPreview?.previewUrl) {
          return { selectedTrack: track, previewUrl: trackWithPreview.previewUrl };
        }
      } catch (err) {
        this.logger.warn(`Failed to process preview for ${track.id}: ${err.message}`);
      }
    }

    throw new BadRequestException("No tracks with preview audio available in this playlist.");
  }

  /**
   * Get current game state
   */
  async getGameState(gameSessionId: string): Promise<GameStateDto> {
    const game = await this.gameSessionRepository.findById(gameSessionId);

    if (!game) {
      throw new NotFoundException("Game session not found");
    }

    // We need to refetch track options - in a real app you'd cache this
    // For now, return empty and let frontend use what it has
    const guesses = game.guesses as unknown as GuessHistoryDto[];

    return {
      sessionId: game.id,
      currentRound: game.currentRound,
      snippetDuration:
        ROUND_DURATIONS[Math.min(game.currentRound, MAX_ROUNDS - 1)],
      status: game.status,
      guesses,
      previewUrl: game.previewUrl ?? undefined,
      trackOptions: [], // Frontend should cache this from startGame
      answer:
        game.status !== GameStatus.PLAYING
          ? {
              id: game.trackId,
              name: game.trackName,
              artist: game.artistName,
              albumImageUrl: game.albumImageUrl || undefined,
            }
          : null,
    };
  }

  /**
   * Submit a guess
   */
  async submitGuess(
    gameSessionId: string,
    dto: GuessDto
  ): Promise<GuessResultDto> {
    const game = await this.gameSessionRepository.findById(gameSessionId);
  
    if (!game) {
      throw new NotFoundException("Game session not found");
    }
    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException("Game is already over");
    }
  
    const guesses = game.guesses as unknown as GuessHistoryDto[];
    
    let result: GuessResult = GuessResult.Wrong;
    
    if (dto.skip || !dto.trackId) {
      result = GuessResult.Skip;
    } else if (dto.trackId === game.trackId) {
      result = GuessResult.Correct;
    } else {
      // TODO: In the future, fetch dto.trackId metadata to check if artist matches
      // result = isSameArtist ? "artist" : "wrong";
      result = GuessResult.Wrong;
    }
  
    // 2. Build History Entry
    // We use the ID as a placeholder for name/artist until the frontend sends them 
    // or we look them up in our Tracks table.
    const newGuess: GuessHistoryDto = {
      trackId: dto.trackId ?? undefined,
      trackName: result === GuessResult.Correct ? game.trackName : "Unknown", 
      artistName: result === GuessResult.Correct ? game.artistName : "Unknown",
      result,
    };
    guesses.push(newGuess);
  
    // 3. Calculate New State
    const newRound = game.currentRound + 1;
    const isWin = result === GuessResult.Correct;
    const isLoss = !isWin && newRound >= MAX_ROUNDS;
    
    let status: GameStatus;
    if (isWin) {
      status = GameStatus.WON;
    } else if (isLoss) {
      status = GameStatus.LOST;
    } else {
      status = GameStatus.PLAYING;
    }
    const gameOver = isWin || isLoss;
  
    await this.gameSessionRepository.updateSessionProgress(gameSessionId, {
      currentRound: newRound,
      guesses,
      status,
      completedAt: gameOver ? new Date() : undefined,
    });
  
    return {
      result,
      gameOver,
      status,
      currentRound: newRound,
      snippetDuration: ROUND_DURATIONS[Math.min(newRound, MAX_ROUNDS - 1)],
    };
  }
}
