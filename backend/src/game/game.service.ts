import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/services/auth.service";
import { PlaylistsService } from "../playlists/playlists.service";
import {
  ROUND_DURATIONS,
  MAX_ROUNDS,
  GameStateDto,
  GuessResultDto,
  TrackOptionDto,
  GuessHistoryDto,
  DailyStateDto,
} from "./dto/game.dto";
import * as crypto from "crypto";

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private playlistsService: PlaylistsService
  ) {}

  /**
   * Start a new game session from a playlist
   */
  async startGame(
    sessionId: string | null,
    playlistId: string
  ): Promise<GameStateDto> {
    // Get user if logged in
    let userId: string | null = null;
    if (sessionId) {
      const user = await this.authService.getCurrentUser(sessionId);
      if (user) {
        // Find user in DB
        const dbUser = await this.prisma.user.findUnique({
          where: { spotifyUserId: user.spotifyUserId },
        });
        userId = dbUser?.id || null;
      }
    }

    // Fetch playlist tracks
    const playlist = await this.playlistsService.getPlaylistById(
      sessionId || "",
      playlistId
    );

    if (!playlist || playlist.tracks.length === 0) {
      throw new BadRequestException("Playlist is empty or not found");
    }

    // Filter tracks that have preview URLs
    const tracksWithPreviews = playlist.tracks.filter(
      (t) => t.track.previewUrl
    );

    if (tracksWithPreviews.length === 0) {
      throw new BadRequestException(
        "No tracks with preview audio in this playlist"
      );
    }

    // Pick a random track
    const randomIndex = Math.floor(Math.random() * tracksWithPreviews.length);
    const selectedTrack = tracksWithPreviews[randomIndex].track;

    // Create game session
    const game = await this.prisma.gameSession.create({
      data: {
        userId,
        playlistId,
        isDaily: false,
        trackId: selectedTrack.id,
        trackName: selectedTrack.name,
        artistName: selectedTrack.artists.map((a) => a.name).join(", "),
        previewUrl: selectedTrack.previewUrl,
        currentRound: 0,
        guesses: [],
        status: "playing",
      },
    });

    // Build track options for guessing
    const trackOptions: TrackOptionDto[] = playlist.tracks.map((t) => ({
      id: t.track.id,
      name: t.track.name,
      artist: t.track.artists.map((a) => a.name).join(", "),
    }));

    return {
      sessionId: game.id,
      currentRound: 0,
      snippetDuration: ROUND_DURATIONS[0],
      status: "playing",
      guesses: [],
      previewUrl: game.previewUrl,
      trackOptions,
      answer: null,
    };
  }

  /**
   * Get current game state
   */
  async getGameState(gameSessionId: string): Promise<GameStateDto> {
    const game = await this.prisma.gameSession.findUnique({
      where: { id: gameSessionId },
    });

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
      status: game.status as "playing" | "won" | "lost",
      guesses,
      previewUrl: game.previewUrl,
      trackOptions: [], // Frontend should cache this from startGame
      answer:
        game.status !== "playing"
          ? {
              id: game.trackId,
              name: game.trackName,
              artist: game.artistName,
            }
          : null,
    };
  }

  /**
   * Submit a guess
   */
  async submitGuess(
    gameSessionId: string,
    trackId: string | null,
    skip: boolean
  ): Promise<GuessResultDto> {
    const game = await this.prisma.gameSession.findUnique({
      where: { id: gameSessionId },
    });

    if (!game) {
      throw new NotFoundException("Game session not found");
    }

    if (game.status !== "playing") {
      throw new BadRequestException("Game is already over");
    }

    const guesses = game.guesses as unknown as GuessHistoryDto[];
    let result: "correct" | "artist" | "wrong" | "skip";
    let guessTrackName: string | null = null;
    let guessArtistName: string | null = null;

    if (skip || !trackId) {
      result = "skip";
    } else {
      // Check the guess
      if (trackId === game.trackId) {
        result = "correct";
        guessTrackName = game.trackName;
        guessArtistName = game.artistName;
      } else {
        // Need to check if artist matches
        // For simplicity, we'll check if the guess was for a track by same artist
        // This would require fetching the guessed track info
        // For now, we'll use a simple approach: check if artist name is contained
        guessTrackName = trackId; // Placeholder - frontend sends track name
        guessArtistName = trackId; // Placeholder

        // The frontend should send trackName and artistName too
        // For now, mark as wrong - we'll improve this
        result = "wrong";
      }
    }

    // Add guess to history
    const newGuess: GuessHistoryDto = {
      trackId,
      trackName: guessTrackName,
      artistName: guessArtistName,
      result,
    };
    guesses.push(newGuess);

    // Determine game status
    const newRound = game.currentRound + 1;
    let status: "playing" | "won" | "lost" = "playing";
    let gameOver = false;

    if (result === "correct") {
      status = "won";
      gameOver = true;
    } else if (newRound >= MAX_ROUNDS) {
      status = "lost";
      gameOver = true;
    }

    // Update game session
    await this.prisma.gameSession.update({
      where: { id: gameSessionId },
      data: {
        currentRound: newRound,
        guesses: guesses as unknown as any,
        status,
        completedAt: gameOver ? new Date() : null,
      },
    });

    return {
      result,
      gameOver,
      status,
      currentRound: newRound,
      snippetDuration: ROUND_DURATIONS[Math.min(newRound, MAX_ROUNDS - 1)],
    };
  }

  /**
   * Get or create today's daily puzzle (trusted users only)
   */
  async getDailyPuzzle(sessionId: string): Promise<DailyStateDto> {
    // Verify user is trusted
    const user = await this.authService.getCurrentUser(sessionId);
    if (!user) {
      throw new ForbiddenException("Must be logged in");
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { spotifyUserId: user.spotifyUserId },
    });

    if (!dbUser?.isTrusted) {
      throw new ForbiddenException("Daily mode is only for trusted users");
    }

    // Get today's date (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if puzzle exists for today
    let puzzle = await this.prisma.dailyPuzzle.findUnique({
      where: { date: today },
    });

    // If no puzzle, create one
    if (!puzzle) {
      puzzle = await this.createDailyPuzzle(today, sessionId);
    }

    // Check if user already played today
    const existingResult = await this.prisma.dailyResult.findUnique({
      where: {
        puzzleId_userId: {
          puzzleId: puzzle.id,
          userId: dbUser.id,
        },
      },
    });

    // Get track options (from the puzzle's playlist)
    const playlist = await this.playlistsService.getPlaylistById(
      sessionId,
      puzzle.playlistId
    );

    const trackOptions: TrackOptionDto[] =
      playlist?.tracks.map((t) => ({
        id: t.track.id,
        name: t.track.name,
        artist: t.track.artists.map((a) => a.name).join(", "),
      })) || [];

    if (existingResult) {
      // User already played
      const guesses = existingResult.guesses as unknown as GuessHistoryDto[];
      return {
        sessionId: `daily-${puzzle.id}`,
        date: today.toISOString().split("T")[0],
        playlistName: puzzle.playlistName,
        currentRound: guesses.length,
        snippetDuration:
          ROUND_DURATIONS[Math.min(guesses.length, MAX_ROUNDS - 1)],
        status: existingResult.wonAt ? "won" : "lost",
        guesses,
        previewUrl: puzzle.previewUrl,
        trackOptions,
        answer: {
          id: puzzle.trackId,
          name: puzzle.trackName,
          artist: puzzle.artistName,
        },
        alreadyPlayed: true,
        previousResult: {
          guesses,
          score: existingResult.score,
          wonAt: existingResult.wonAt,
        },
      };
    }

    // Fresh daily game
    return {
      sessionId: `daily-${puzzle.id}`,
      date: today.toISOString().split("T")[0],
      playlistName: puzzle.playlistName,
      currentRound: 0,
      snippetDuration: ROUND_DURATIONS[0],
      status: "playing",
      guesses: [],
      previewUrl: puzzle.previewUrl,
      trackOptions,
      answer: null,
      alreadyPlayed: false,
      previousResult: null,
    };
  }

  /**
   * Submit a guess for the daily puzzle
   */
  async submitDailyGuess(
    sessionId: string,
    trackId: string | null,
    skip: boolean
  ): Promise<GuessResultDto> {
    // Verify user is trusted
    const user = await this.authService.getCurrentUser(sessionId);
    if (!user) {
      throw new ForbiddenException("Must be logged in");
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { spotifyUserId: user.spotifyUserId },
    });

    if (!dbUser?.isTrusted) {
      throw new ForbiddenException("Daily mode is only for trusted users");
    }

    // Get today's puzzle
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const puzzle = await this.prisma.dailyPuzzle.findUnique({
      where: { date: today },
    });

    if (!puzzle) {
      throw new NotFoundException("No daily puzzle for today");
    }

    // Get or create result
    let result = await this.prisma.dailyResult.findUnique({
      where: {
        puzzleId_userId: {
          puzzleId: puzzle.id,
          userId: dbUser.id,
        },
      },
    });

    if (
      result &&
      (result.wonAt !== null || (result.guesses as any[]).length >= MAX_ROUNDS)
    ) {
      throw new BadRequestException("Already completed today's puzzle");
    }

    const guesses = (result?.guesses || []) as unknown as GuessHistoryDto[];
    let guessResult: "correct" | "artist" | "wrong" | "skip";

    if (skip || !trackId) {
      guessResult = "skip";
    } else if (trackId === puzzle.trackId) {
      guessResult = "correct";
    } else {
      // Check for artist match (partial credit)
      // Simple check: see if the guessed track has same artist
      guessResult = "wrong"; // Default to wrong
    }

    // Add guess
    const newGuess: GuessHistoryDto = {
      trackId,
      trackName: trackId ? "Unknown" : null, // Would need to look up
      artistName: null,
      result: guessResult,
    };
    guesses.push(newGuess);

    const newRound = guesses.length;
    let status: "playing" | "won" | "lost" = "playing";
    let gameOver = false;
    let score = 0;
    let wonAt: number | null = null;

    if (guessResult === "correct") {
      status = "won";
      gameOver = true;
      wonAt = newRound;
      score = MAX_ROUNDS - newRound + 1; // 6 points for round 1, 1 point for round 6
    } else if (newRound >= MAX_ROUNDS) {
      status = "lost";
      gameOver = true;
      score = 0;
    }

    // Upsert result
    await this.prisma.dailyResult.upsert({
      where: {
        puzzleId_userId: {
          puzzleId: puzzle.id,
          userId: dbUser.id,
        },
      },
      create: {
        puzzleId: puzzle.id,
        userId: dbUser.id,
        guesses: guesses as unknown as any,
        score,
        wonAt,
      },
      update: {
        guesses: guesses as unknown as any,
        score,
        wonAt,
      },
    });

    return {
      result: guessResult,
      gameOver,
      status,
      currentRound: newRound,
      snippetDuration: ROUND_DURATIONS[Math.min(newRound, MAX_ROUNDS - 1)],
    };
  }

  /**
   * Create a daily puzzle from trusted users' playlists
   */
  private async createDailyPuzzle(date: Date, sessionId: string) {
    // Get all trusted users
    const trustedUsers = await this.prisma.user.findMany({
      where: { isTrusted: true },
    });

    if (trustedUsers.length === 0) {
      throw new Error("No trusted users found");
    }

    // Use date as seed for deterministic selection
    const seed = date.toISOString().split("T")[0];
    const hash = crypto.createHash("sha256").update(seed).digest("hex");
    const seedNum = parseInt(hash.substring(0, 8), 16);

    // Pick a trusted user (rotate based on date)
    const userIndex = seedNum % trustedUsers.length;
    const selectedUser = trustedUsers[userIndex];

    // For now, use mock playlist since we can't fetch real ones without OAuth
    // In production, this would fetch the user's public playlists
    const mockPlaylistId = "mock_playlist_1";
    const mockPlaylistName = "Trusted User's Playlist";

    // Mock track selection (in production, fetch from Spotify)
    const mockTrackId = `daily_track_${seed}`;
    const mockTrackName = "Daily Mystery Song";
    const mockArtistName = "Mystery Artist";

    // Create puzzle
    return this.prisma.dailyPuzzle.create({
      data: {
        date,
        playlistId: mockPlaylistId,
        playlistName: mockPlaylistName,
        trackId: mockTrackId,
        trackName: mockTrackName,
        artistName: mockArtistName,
        previewUrl: null, // Would be real preview URL
      },
    });
  }
}
