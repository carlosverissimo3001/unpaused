import { Test, TestingModule } from '@nestjs/testing';
import { GameMode } from '@prisma/client';
import { subDays, startOfDay } from 'date-fns';
import { UserPreferencesService } from '../../user-preferences/services/user-preferences.service';
import { GameStatsEntity } from '../entities/game-stats.entity';
import { GameStatsRepository } from '../repositories/game-stats.repository';
import { GameStatsService } from './game-stats.service';

const USER_ID = 'user-1';

function makeStats(overrides: Partial<GameStatsEntity> = {}): GameStatsEntity {
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

const mockGameStatsRepository = {
  findByUserId: jest.fn(),
  upsert: jest.fn(),
  update: jest.fn(),
};

const mockUserPreferencesService = {
  getUserTimezone: jest.fn().mockResolvedValue('UTC'),
};

// Fixed reference date: 2026-03-15T12:00:00Z (a Sunday)
const FAKE_NOW = new Date('2026-03-15T12:00:00.000Z');
const TODAY = startOfDay(FAKE_NOW);

describe('GameStatsService', () => {
  let service: GameStatsService;

  beforeAll(() => {
    jest.useFakeTimers({ now: FAKE_NOW });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameStatsService,
        { provide: GameStatsRepository, useValue: mockGameStatsRepository },
        {
          provide: UserPreferencesService,
          useValue: mockUserPreferencesService,
        },
      ],
    }).compile();

    service = module.get<GameStatsService>(GameStatsService);
    jest.clearAllMocks();
    mockUserPreferencesService.getUserTimezone.mockResolvedValue('UTC');
    mockGameStatsRepository.update.mockResolvedValue(undefined);
  });

  // ── mode routing ────────────────────────────────────────────────

  describe('recordFinishedGame', () => {
    it('writes a daily to the daily row, not the free-play one', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(makeStats());

      await service.recordFinishedGame({
        userId: USER_ID,
        lastGameRound: 3,
        mode: GameMode.DAILY,
      });

      expect(mockGameStatsRepository.upsert).toHaveBeenCalledWith(
        USER_ID,
        GameMode.DAILY,
      );
      expect(mockGameStatsRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockGameStatsRepository.update).toHaveBeenCalledTimes(1);
    });

    it('writes free play to the free-play row only', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ mode: GameMode.ALL }),
      );

      await service.recordFinishedGame({
        userId: USER_ID,
        lastGameRound: 3,
        mode: GameMode.ALL,
      });

      expect(mockGameStatsRepository.upsert).toHaveBeenCalledWith(
        USER_ID,
        GameMode.ALL,
      );
      expect(mockGameStatsRepository.upsert).toHaveBeenCalledTimes(1);
    });

    it.each([GameMode.MULTIPLAYER, GameMode.GAUNTLET])(
      'writes no stats row for %s',
      async (mode) => {
        await service.recordFinishedGame({
          userId: USER_ID,
          lastGameRound: 3,
          mode,
        });

        expect(mockGameStatsRepository.upsert).not.toHaveBeenCalled();
        expect(mockGameStatsRepository.update).not.toHaveBeenCalled();
      },
    );
  });

  // ── free play: a run of wins ────────────────────────────────────

  describe('free play', () => {
    const recordAll = (lastGameRound: number) =>
      service.recordFinishedGame({
        userId: USER_ID,
        lastGameRound,
        mode: GameMode.ALL,
      });

    it('extends the run on a win', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ mode: GameMode.ALL, currentStreak: 4 }),
      );

      await recordAll(2);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 5, won: true }),
        GameMode.ALL,
      );
    });

    it('ends the run on a loss', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ mode: GameMode.ALL, currentStreak: 4 }),
      );

      await recordAll(6);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 0, won: false }),
        GameMode.ALL,
      );
    });

    it('counts rounds, not days, so two wins the same day both count', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({
          mode: GameMode.ALL,
          currentStreak: 4,
          lastWinDate: FAKE_NOW,
        }),
      );

      await recordAll(2);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 5 }),
        GameMode.ALL,
      );
    });

    it('does not date a run — lastWinDate belongs to the daily', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ mode: GameMode.ALL }),
      );

      await recordAll(2);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.not.objectContaining({ lastWinDate: expect.anything() }),
        GameMode.ALL,
      );
    });
  });

  // ── daily: a streak of days ─────────────────────────────────────

  describe('daily', () => {
    const recordDaily = (lastGameRound: number) =>
      service.recordFinishedGame({
        userId: USER_ID,
        lastGameRound,
        mode: GameMode.DAILY,
      });

    it('should increment streak on consecutive day win', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ lastWinDate: subDays(TODAY, 1), currentStreak: 5 }),
      );

      await recordDaily(3);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 6, won: true }),
        GameMode.DAILY,
      );
    });

    it('should not double-count when already won today', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ lastWinDate: TODAY, currentStreak: 5 }),
      );

      await recordDaily(2);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 5, won: true }),
        GameMode.DAILY,
      );
    });

    it('should reset streak to 1 when gap exists', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ lastWinDate: subDays(FAKE_NOW, 5), currentStreak: 10 }),
      );

      await recordDaily(0);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 1, won: true }),
        GameMode.DAILY,
      );
    });

    it('should set streak to 1 on first win ever', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ lastWinDate: undefined, currentStreak: 0 }),
      );

      await recordDaily(4);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 1, won: true }),
        GameMode.DAILY,
      );
    });

    it('should reset streak to 0 on loss', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ currentStreak: 5 }),
      );

      // Round 6 = loss (GAME_MAX_ROUNDS is 6)
      await recordDaily(6);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 0, won: false }),
        GameMode.DAILY,
      );
    });

    it('should preserve best streak on loss', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({ currentStreak: 3, bestStreak: 10 }),
      );

      await recordDaily(6);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ bestStreak: 10 }),
        GameMode.DAILY,
      );
    });

    it('should update best streak when current exceeds it', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({
          lastWinDate: subDays(TODAY, 1),
          currentStreak: 10,
          bestStreak: 10,
        }),
      );

      await recordDaily(0);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 11, bestStreak: 11 }),
        GameMode.DAILY,
      );
    });

    it('should update round distribution correctly', async () => {
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({
          lastWinDate: subDays(TODAY, 1),
          roundDistribution: [0, 0, 0, 0, 0, 0, 0],
        }),
      );

      // Won on round 3 (index 3)
      await recordDaily(3);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          roundDistribution: [0, 0, 0, 1, 0, 0, 0],
        }),
        GameMode.DAILY,
      );
    });

    it('reads the day boundary in the player timezone, not the server one', async () => {
      // Now is the 15th in UTC but already the 16th in Auckland. A win at
      // 02:00 UTC is the same UTC day (which would leave the streak alone)
      // but the previous Auckland day, which continues it.
      mockUserPreferencesService.getUserTimezone.mockResolvedValue(
        'Pacific/Auckland',
      );
      mockGameStatsRepository.upsert.mockResolvedValue(
        makeStats({
          lastWinDate: new Date('2026-03-15T02:00:00.000Z'),
          currentStreak: 7,
        }),
      );

      await recordDaily(1);

      expect(mockGameStatsRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ currentStreak: 8 }),
        GameMode.DAILY,
      );
    });
  });
});
