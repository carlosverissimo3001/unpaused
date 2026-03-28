import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GameMode } from '@prisma/client';
import { StreakService } from './streak.service';
import { PrismaService } from '@prisma/prisma.service';
import { AuthService } from '@auth/services/auth.service';
import { GameStatsRepository } from '../../game/repositories/game-stats.repository';
import { GameStatsEntity } from '../../game/entities/game-stats.entity';
import { UserPreferencesService } from '../../user-preferences/services/user-preferences.service';
import { subDays, addDays, startOfDay } from 'date-fns';

// ── Constants ────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

// ── Factories ────────────────────────────────────────────────────────

const DEFAULT_USER = {
  id: USER_ID,
  spotifyUserId: 'spotify-1',
  displayName: 'Test User',
  isTrusted: true,
  streakFreezes: 3,
};

function makeUser(overrides: Partial<typeof DEFAULT_USER> = {}) {
  return { ...DEFAULT_USER, ...overrides };
}

function makeDailyStats(
  overrides: Partial<GameStatsEntity> = {},
): GameStatsEntity {
  return {
    userId: USER_ID,
    mode: GameMode.DAILY,
    currentStreak: 5,
    bestStreak: 10,
    totalGames: 20,
    totalWins: 15,
    roundDistribution: [2, 3, 4, 3, 2, 1, 5],
    lastWinDate: undefined,
    ...overrides,
  };
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockPrismaService = {
  streakFreezeUsage: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  user: { update: jest.fn() },
  stats: { update: jest.fn() },
  $transaction: jest.fn(),
};

const mockAuthService = {
  getUserBySessionId: jest.fn(),
};

const mockGameStatsRepository = {
  findByUserId: jest.fn(),
  upsert: jest.fn(),
  update: jest.fn(),
};

const mockUserPreferencesService = {
  getUserTimezone: jest.fn().mockResolvedValue('UTC'),
};

// ── Test Suite ───────────────────────────────────────────────────────

// Fixed reference date: 2026-03-15T12:00:00Z (a Sunday)
const FAKE_NOW = new Date('2026-03-15T12:00:00.000Z');
const TODAY = startOfDay(FAKE_NOW);

describe('StreakService', () => {
  let service: StreakService;

  beforeAll(() => {
    jest.useFakeTimers({ now: FAKE_NOW });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GameStatsRepository, useValue: mockGameStatsRepository },
        {
          provide: UserPreferencesService,
          useValue: mockUserPreferencesService,
        },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
    jest.clearAllMocks();
  });

  // ── getStreakStatus ──────────────────────────────────────────────

  describe('getStreakStatus', () => {
    it('should return playedToday=true when user won today', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(makeUser());
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({ lastWinDate: FAKE_NOW, currentStreak: 5 }),
      );

      const result = await service.getStreakStatus(SESSION_ID);

      expect(result.playedToday).toBe(true);
      expect(result.streakAtRisk).toBe(false);
      expect(result.currentStreak).toBe(5);
    });

    it('should return streakAtRisk=true when gap > 1 day', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(makeUser());
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 3),
          currentStreak: 5,
        }),
      );

      const result = await service.getStreakStatus(SESSION_ID);

      expect(result.streakAtRisk).toBe(true);
      expect(result.gapDays).toBe(2);
      expect(result.canSaveStreak).toBe(true);
    });

    it('should return canSaveStreak=false when not enough freezes', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(
        makeUser({ streakFreezes: 0 }),
      );
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 3),
          currentStreak: 5,
        }),
      );

      const result = await service.getStreakStatus(SESSION_ID);

      expect(result.streakAtRisk).toBe(true);
      expect(result.canSaveStreak).toBe(false);
    });

    it('should return canSaveStreak=false when user is not trusted', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(
        makeUser({ isTrusted: false }),
      );
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 3),
          currentStreak: 5,
        }),
      );

      const result = await service.getStreakStatus(SESSION_ID);

      expect(result.canSaveStreak).toBe(false);
    });

    it('should not flag streak at risk when streak is 0', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(makeUser());
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 5),
          currentStreak: 0,
        }),
      );

      const result = await service.getStreakStatus(SESSION_ID);

      expect(result.streakAtRisk).toBe(false);
    });

    it('should handle first-time user with no lastWinDate', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(makeUser());
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({ lastWinDate: undefined, currentStreak: 0 }),
      );

      const result = await service.getStreakStatus(SESSION_ID);

      expect(result.playedToday).toBe(false);
      expect(result.streakAtRisk).toBe(false);
      expect(result.gapDays).toBe(0);
    });
  });

  // ── getFreezeUsagesInRange ──────────────────────────────────────

  describe('getFreezeUsagesInRange', () => {
    it('should query prisma with timezone-aware date range', async () => {
      mockPrismaService.streakFreezeUsage.findMany.mockResolvedValue([]);

      await service.getFreezeUsagesInRange(USER_ID, '2026-03-01', '2026-03-15');

      expect(
        mockPrismaService.streakFreezeUsage.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          coveredFrom: { gte: new Date('2026-03-01T00:00:00.000Z') },
          coveredTo: { lt: new Date('2026-03-16T00:00:00.000Z') },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ── updateDailyStreak ───────────────────────────────────────────

  describe('updateDailyStreak', () => {
    it('should increment streak on consecutive day win', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({ lastWinDate: subDays(TODAY, 1), currentStreak: 5 }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      await service.updateDailyStreak(USER_ID, 3);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          currentStreak: 6,
          won: true,
        }),
        GameMode.DAILY,
      );
    });

    it('should not double-count when already won today', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({
          lastWinDate: TODAY,
          currentStreak: 5,
        }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      await service.updateDailyStreak(USER_ID, 2);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          currentStreak: 5,
          won: true,
        }),
        GameMode.DAILY,
      );
    });

    it('should reset streak to 1 when gap exists', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 5),
          currentStreak: 10,
        }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      await service.updateDailyStreak(USER_ID, 0);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          currentStreak: 1,
          won: true,
        }),
        GameMode.DAILY,
      );
    });

    it('should set streak to 1 on first win ever', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({ lastWinDate: undefined, currentStreak: 0 }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      await service.updateDailyStreak(USER_ID, 4);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          currentStreak: 1,
          won: true,
        }),
        GameMode.DAILY,
      );
    });

    it('should reset streak to 0 on loss', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({ currentStreak: 5 }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      // Round 6 = loss (GAME_MAX_ROUNDS is 6)
      await service.updateDailyStreak(USER_ID, 6);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          currentStreak: 0,
          won: false,
        }),
        GameMode.DAILY,
      );
    });

    it('should preserve best streak on loss', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({ currentStreak: 3, bestStreak: 10 }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      await service.updateDailyStreak(USER_ID, 6);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          bestStreak: 10,
        }),
        GameMode.DAILY,
      );
    });

    it('should update best streak when current exceeds it', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(TODAY, 1),
          currentStreak: 10,
          bestStreak: 10,
        }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      await service.updateDailyStreak(USER_ID, 0);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          currentStreak: 11,
          bestStreak: 11,
        }),
        GameMode.DAILY,
      );
    });

    it('should update round distribution correctly', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(TODAY, 1),
          roundDistribution: [0, 0, 0, 0, 0, 0, 0],
        }),
      );
      mockGameStatsRepository.update.mockResolvedValue(undefined);

      // Won on round 3 (index 3)
      await service.updateDailyStreak(USER_ID, 3);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          roundDistribution: [0, 0, 0, 1, 0, 0, 0],
        }),
        GameMode.DAILY,
      );
    });
  });

  // ── useFreeze ───────────────────────────────────────────────────

  describe('useFreeze', () => {
    it('should throw when no streak to save', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(makeUser());
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({ currentStreak: 0 }),
      );

      await expect(service.useFreeze(SESSION_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when streak is not at risk (won yesterday)', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(makeUser());
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 1),
          currentStreak: 5,
        }),
      );

      await expect(service.useFreeze(SESSION_ID)).rejects.toThrow(
        'Streak is not at risk',
      );
    });

    it('should throw when not enough freezes', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue(
        makeUser({ streakFreezes: 1 }),
      );
      mockGameStatsRepository.findByUserId.mockResolvedValue(
        makeDailyStats({
          lastWinDate: subDays(FAKE_NOW, 4),
          currentStreak: 5,
        }),
      );

      await expect(service.useFreeze(SESSION_ID)).rejects.toThrow(
        'Not enough freezes',
      );
    });

    it('should execute transaction with correct data on successful freeze', async () => {
      // lastWin 3 days ago → gapDays = 2
      const lastWin = subDays(TODAY, 3);

      mockPrismaService.$transaction.mockResolvedValue(undefined);
      mockAuthService.getUserBySessionId
        .mockResolvedValueOnce(makeUser({ streakFreezes: 5 }))
        .mockResolvedValueOnce(makeUser({ streakFreezes: 3 }));

      mockGameStatsRepository.findByUserId
        .mockResolvedValueOnce(
          makeDailyStats({ lastWinDate: lastWin, currentStreak: 5 }),
        )
        .mockResolvedValueOnce(
          makeDailyStats({ currentStreak: 7 }),
        );

      await service.useFreeze(SESSION_ID);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      const txArg = mockPrismaService.$transaction.mock.calls[0][0];
      expect(txArg).toHaveLength(3);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { streakFreezes: { decrement: 2 } },
        }),
      );
      expect(mockPrismaService.stats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_mode: { userId: USER_ID, mode: GameMode.DAILY } },
        }),
      );
      expect(mockPrismaService.streakFreezeUsage.create).toHaveBeenCalled();
    });
  });
});
