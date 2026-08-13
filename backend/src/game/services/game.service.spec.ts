import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GameMode, GameStatus } from '@prisma/client';
import { GameService } from './game.service';
import { GameSessionRepository } from '../repositories/game-session.repository';
import { GameStatsService } from './game-stats.service';
import { TrackRepository } from '@/track/repositories/track.repository';
import { TrackService } from '@/track/services/track.service';
import { AuthService } from '@auth/services/auth.service';
import { PlaylistService } from '@/playlist/services/playlist.service';
import { PrismaService } from '@prisma/prisma.service';
import { AppLoggerService } from '../../logger/logger.service';
import { GameSessionEntity } from '../entities/game-session.entity';
import { UserPreferencesRepository } from '../../user-preferences/repositories/user-preferences.repository';
import { UserPreferencesService } from '../../user-preferences/services/user-preferences.service';
import { StreakService } from '../../streak/services/streak.service';
import { LastfmService } from '@/track/services/lastfm.service';

jest.mock('@/playlist/services/playlist.service');
jest.mock('@/track/services/track.service');
jest.mock('@auth/services/auth.service');

jest.mock('@transaction/transaction.store', () => ({
  ...jest.requireActual('@transaction/transaction.store'),
  getBasePrismaClient: () => ({
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  }),
}));

describe('GameService', () => {
  let service: GameService;

  const OWNER_SESSION_ID = 'session-owner';
  const OTHER_SESSION_ID = 'session-other';
  const OWNER_USER_ID = 'user-owner';
  const OTHER_USER_ID = 'user-other';
  const GAME_ID = 'game-123';
  const TRACK_ID = 'track-456';

  const mockTrack = {
    id: TRACK_ID,
    name: 'Test Song',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    albumImageUrl: 'https://example.com/album.jpg',
    albumUrl: 'https://open.spotify.com/album/123',
    releaseYear: '2024',
    previewUrl: 'https://example.com/preview.mp3',
    lastScrapedAt: new Date(),
  };

  const makeGameSession = (
    overrides?: Partial<GameSessionEntity>,
  ): GameSessionEntity => ({
    id: GAME_ID,
    userId: OWNER_USER_ID,
    playlistId: 'playlist-1',
    mode: GameMode.ALL,
    trackId: TRACK_ID,
    currentRound: 0,
    guesses: [],
    status: GameStatus.PLAYING,
    createdAt: new Date(),
    ...overrides,
  });

  const mockAuthService = {
    getUserBySessionId: jest.fn(),
  };

  const mockGameSessionRepository = {
    findByIdWithTrack: jest.fn(),
    updateSessionProgress: jest.fn(),
  };

  const mockTrackRepository = {};

  const mockGameStatsService = {
    getStats: jest.fn(),
    updateGameStats: jest.fn(),
  };

  const mockPlaylistService = {};
  const mockTrackService = {};
  const mockPrismaService = {};
  const mockUserPreferencesRepository = {
    findByUserId: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: GameSessionRepository,
          useValue: mockGameSessionRepository,
        },
        { provide: TrackRepository, useValue: mockTrackRepository },
        { provide: GameStatsService, useValue: mockGameStatsService },
        { provide: PlaylistService, useValue: mockPlaylistService },
        { provide: TrackService, useValue: mockTrackService },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepository,
        },
        { provide: AppLoggerService, useValue: new AppLoggerService() },
        {
          provide: UserPreferencesService,
          useValue: {
            get: jest.fn(),
            getUserTimezone: jest.fn().mockResolvedValue('UTC'),
          },
        },
        {
          provide: StreakService,
          useValue: {
            updateDailyStreak: jest.fn(),
            getFreezeUsagesInRange: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: LastfmService,
          useValue: { getTrackInfo: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGameState', () => {
    it('should return game state when the requesting user owns the session', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });

      const result = await service.getGameState(OWNER_SESSION_ID, GAME_ID);

      expect(result.sessionId).toBe(GAME_ID);
      expect(result.status).toBe(GameStatus.PLAYING);
      expect(result.previewUrl).toBe(mockTrack.previewUrl);
    });

    it('should fetch user and game+track in parallel', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });

      await service.getGameState(OWNER_SESSION_ID, GAME_ID);

      expect(mockAuthService.getUserBySessionId).toHaveBeenCalledWith(
        OWNER_SESSION_ID,
      );
      expect(mockGameSessionRepository.findByIdWithTrack).toHaveBeenCalledWith(
        GAME_ID,
      );
    });

    it('should throw NotFoundException when a different user tries to access the session', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });

      await expect(
        service.getGameState(OTHER_SESSION_ID, GAME_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when game session does not exist', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue(null);

      await expect(
        service.getGameState(OWNER_SESSION_ID, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when track has no preview URL', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: { ...mockTrack, previewUrl: null },
      });

      await expect(
        service.getGameState(OWNER_SESSION_ID, GAME_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not leak whether a game exists when ownership fails', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });

      try {
        await service.getGameState(OTHER_SESSION_ID, GAME_ID);
        fail('Expected NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toBe(
          'Game session not found',
        );
      }
    });
  });

  describe('submitGuess', () => {
    const guessDto = {
      trackId: 'some-track',
      trackName: 'Some Song',
      artistName: 'Some Artist',
      albumName: 'Some Album',
      skip: false,
    };

    it('should accept a guess from the session owner', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });
      mockGameSessionRepository.updateSessionProgress.mockResolvedValue(
        makeGameSession({ currentRound: 1 }),
      );

      const result = await service.submitGuess(
        OWNER_SESSION_ID,
        GAME_ID,
        guessDto,
      );

      expect(result).toBeDefined();
      expect(result.currentRound).toBe(1);
    });

    it('should fetch user and game+track in parallel', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });
      mockGameSessionRepository.updateSessionProgress.mockResolvedValue(
        makeGameSession({ currentRound: 1 }),
      );

      await service.submitGuess(OWNER_SESSION_ID, GAME_ID, guessDto);

      expect(mockAuthService.getUserBySessionId).toHaveBeenCalledWith(
        OWNER_SESSION_ID,
      );
      expect(mockGameSessionRepository.findByIdWithTrack).toHaveBeenCalledWith(
        GAME_ID,
      );
    });

    it('should throw NotFoundException when a different user tries to submit a guess', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });

      await expect(
        service.submitGuess(OTHER_SESSION_ID, GAME_ID, guessDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent game session', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue(null);

      await expect(
        service.submitGuess(OWNER_SESSION_ID, 'nonexistent-id', guessDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when game is already over', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession({ status: GameStatus.WON }),
        track: mockTrack,
      });

      await expect(
        service.submitGuess(OWNER_SESSION_ID, GAME_ID, guessDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not leak game existence when ownership check fails', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: mockTrack,
      });

      try {
        await service.submitGuess(OTHER_SESSION_ID, GAME_ID, guessDto);
        fail('Expected NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toBe(
          'Game session not found',
        );
      }
    });

    // --- evaluateGuess partial match tests (CAR-13) ---

    const setupGuessScenario = (trackOverrides?: Record<string, unknown>) => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession(),
        track: { ...mockTrack, ...trackOverrides },
      });
      mockGameSessionRepository.updateSessionProgress.mockResolvedValue(
        makeGameSession({ currentRound: 1 }),
      );
    };

    it('should return ARTIST when artist matches with different casing', async () => {
      setupGuessScenario({
        artistName: 'The Beatles',
        albumName: 'Abbey Road',
      });

      const result = await service.submitGuess(OWNER_SESSION_ID, GAME_ID, {
        trackId: 'wrong-track',
        trackName: 'Wrong Song',
        artistName: 'the beatles', // different casing
        albumName: 'Different Album',
      });

      expect(result.result).toBe('ARTIST');
    });

    it('should return ALBUM when album matches with different casing', async () => {
      setupGuessScenario({
        artistName: 'The Beatles',
        albumName: 'Abbey Road',
      });

      const result = await service.submitGuess(OWNER_SESSION_ID, GAME_ID, {
        trackId: 'wrong-track',
        trackName: 'Wrong Song',
        artistName: 'Wrong Artist',
        albumName: 'ABBEY ROAD', // different casing
      });

      expect(result.result).toBe('ALBUM');
    });

    it('should return ARTIST_AND_ALBUM when both match with different casing', async () => {
      setupGuessScenario({
        artistName: 'The Beatles',
        albumName: 'Abbey Road',
      });

      const result = await service.submitGuess(OWNER_SESSION_ID, GAME_ID, {
        trackId: 'wrong-track',
        trackName: 'Wrong Song',
        artistName: 'THE BEATLES',
        albumName: 'abbey road',
      });

      expect(result.result).toBe('ARTIST_AND_ALBUM');
    });

    it('should return WRONG when neither artist nor album matches', async () => {
      setupGuessScenario();

      const result = await service.submitGuess(OWNER_SESSION_ID, GAME_ID, {
        trackId: 'wrong-track',
        trackName: 'Wrong Song',
        artistName: 'Wrong Artist',
        albumName: 'Wrong Album',
      });

      expect(result.result).toBe('WRONG');
    });

    it('should handle null guess artistName without crashing', async () => {
      setupGuessScenario();

      const result = await service.submitGuess(OWNER_SESSION_ID, GAME_ID, {
        trackId: 'wrong-track',
        trackName: 'Wrong Song',
        // no artistName
        albumName: 'Wrong Album',
      });

      expect(result.result).toBe('WRONG');
    });

    it('should handle null album on both sides gracefully', async () => {
      setupGuessScenario({ albumName: null });

      const result = await service.submitGuess(OWNER_SESSION_ID, GAME_ID, {
        trackId: 'wrong-track',
        trackName: 'Wrong Song',
        artistName: 'Wrong Artist',
        // no albumName on guess either
      });

      expect(result.result).toBe('WRONG');
    });

    it('should check ownership before checking game status', async () => {
      // Game is over AND belongs to a different user
      // Should get NotFoundException (ownership), not BadRequestException (game over)
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
        isTrusted: false,
      });
      mockGameSessionRepository.findByIdWithTrack.mockResolvedValue({
        ...makeGameSession({ status: GameStatus.WON }),
        track: mockTrack,
      });

      await expect(
        service.submitGuess(OTHER_SESSION_ID, GAME_ID, guessDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // evaluateGuess tests moved to game/utils/guess-evaluator.spec.ts
});
