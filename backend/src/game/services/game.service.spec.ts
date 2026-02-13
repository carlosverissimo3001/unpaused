import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GameMode, GameStatus } from '@prisma/client';
import { GameService } from './game.service';
import { GameSessionRepository } from '../repositories/game-session.repository';
import { GameStatsRepository } from '../repositories/game-stats.repository';
import { TrackRepository } from '@/track/repositories/track.repository';
import { TrackService } from '@/track/services/track.service';
import { AuthService } from '@auth/services/auth.service';
import { PlaylistService } from '@/playlist/services/playlist.service';
import { PrismaService } from '@prisma/prisma.service';
import { AppLoggerService } from '../../logger/logger.service';
import { GameSessionEntity } from '../entities/game-session.entity';

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
    getUserById: jest.fn(),
  };

  const mockGameSessionRepository = {
    findById: jest.fn(),
    updateSessionProgress: jest.fn(),
  };

  const mockTrackRepository = {
    findById: jest.fn(),
  };

  const mockGameStatsRepository = {
    upsert: jest.fn(),
    update: jest.fn(),
  };

  const mockPlaylistService = {};
  const mockTrackService = {};
  const mockPrismaService = {};

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
        { provide: GameStatsRepository, useValue: mockGameStatsRepository },
        { provide: PlaylistService, useValue: mockPlaylistService },
        { provide: TrackService, useValue: mockTrackService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AppLoggerService, useValue: new AppLoggerService() },
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
      });
      mockGameSessionRepository.findById.mockResolvedValue(makeGameSession());
      mockTrackRepository.findById.mockResolvedValue(mockTrack);
      mockAuthService.getUserById.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
      });

      const result = await service.getGameState(OWNER_SESSION_ID, GAME_ID);

      expect(result.sessionId).toBe(GAME_ID);
      expect(result.status).toBe(GameStatus.PLAYING);
      expect(result.previewUrl).toBe(mockTrack.previewUrl);
    });

    it('should throw NotFoundException when a different user tries to access the session', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(makeGameSession());

      await expect(
        service.getGameState(OTHER_SESSION_ID, GAME_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when game session does not exist', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(null);

      await expect(
        service.getGameState(OWNER_SESSION_ID, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not leak whether a game exists when ownership fails', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(makeGameSession());

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
      });
      mockGameSessionRepository.findById.mockResolvedValue(makeGameSession());
      mockTrackRepository.findById.mockResolvedValue(mockTrack);
      mockAuthService.getUserById.mockResolvedValue({
        id: OWNER_USER_ID,
        isTrusted: false,
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

    it('should throw NotFoundException when a different user tries to submit a guess', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(makeGameSession());

      await expect(
        service.submitGuess(OTHER_SESSION_ID, GAME_ID, guessDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent game session', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(null);

      await expect(
        service.submitGuess(OWNER_SESSION_ID, 'nonexistent-id', guessDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when game is already over', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OWNER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(
        makeGameSession({ status: GameStatus.WON }),
      );

      await expect(
        service.submitGuess(OWNER_SESSION_ID, GAME_ID, guessDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not leak game existence when ownership check fails', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(makeGameSession());

      try {
        await service.submitGuess(OTHER_SESSION_ID, GAME_ID, guessDto);
        fail('Expected NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toBe(
          'Game session not found',
        );
      }

      // Verify we never reached the track lookup or guess evaluation
      expect(mockTrackRepository.findById).not.toHaveBeenCalled();
    });

    it('should check ownership before checking game status', async () => {
      // Game is over AND belongs to a different user
      // Should get NotFoundException (ownership), not BadRequestException (game over)
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
      });
      mockGameSessionRepository.findById.mockResolvedValue(
        makeGameSession({ status: GameStatus.WON }),
      );

      await expect(
        service.submitGuess(OTHER_SESSION_ID, GAME_ID, guessDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
