import { Test, TestingModule } from '@nestjs/testing';
import { GameStatsRepository } from './game-stats.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { GameMode, Stats } from '@prisma/client';

describe('GameStatsRepository', () => {
  let repository: GameStatsRepository;

  const mockPrismaService = {
    stats: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameStatsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<GameStatsRepository>(GameStatsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return stats when found', async () => {
      const mockStats: Stats = {
        userId: 'user-123',
        mode: GameMode.DAILY,
        currentStreak: 5,
        bestStreak: 10,
        totalGames: 20,
        totalWins: 15,
        roundDistribution: [1, 2, 3, 4, 5, 0, 0],
        lastWinDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.stats.findUnique.mockResolvedValue(mockStats);

      const result = await repository.findByUserId('user-123', GameMode.DAILY);

      expect(result).toEqual({
        ...mockStats,
        lastWinDate: mockStats.lastWinDate,
      });
      expect(mockPrismaService.stats.findUnique).toHaveBeenCalledWith({
        where: { userId_mode: { userId: 'user-123', mode: GameMode.DAILY } },
      });
    });

    it('should return default entity when stats not found', async () => {
      mockPrismaService.stats.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('user-123', GameMode.ALL);

      expect(result).toEqual({
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 0,
        totalWins: 0,
        roundDistribution: [0, 0, 0, 0, 0, 0, 0],
        mode: GameMode.ALL,
        lastWinDate: undefined,
        userId: '',
      });
    });
  });

  describe('upsert', () => {
    it('should upsert stats', async () => {
      const mockStats: Stats = {
        userId: 'user-123',
        mode: GameMode.DAILY,
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 0,
        totalWins: 0,
        roundDistribution: [0, 0, 0, 0, 0, 0, 0],
        lastWinDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.stats.upsert.mockResolvedValue(mockStats);

      const result = await repository.upsert('user-123', GameMode.DAILY);

      expect(result).toEqual({
        ...mockStats,
        lastWinDate: undefined,
      });
      expect(mockPrismaService.stats.upsert).toHaveBeenCalledWith({
        where: { userId_mode: { userId: 'user-123', mode: GameMode.DAILY } },
        create: { userId: 'user-123', mode: GameMode.DAILY },
        update: {},
      });
    });
  });

  describe('update', () => {
    it('should update stats for a win', async () => {
      const updateDto = {
        currentStreak: 6,
        bestStreak: 10,
        roundDistribution: [1, 2, 3, 5, 5, 0, 0],
        won: true,
        lastWinDate: new Date('2024-01-02'),
      };

      const mockUpdatedStats: Stats = {
        userId: 'user-123',
        mode: GameMode.DAILY,
        currentStreak: 6,
        bestStreak: 10,
        totalGames: 21,
        totalWins: 16,
        roundDistribution: [1, 2, 3, 5, 5, 0, 0],
        lastWinDate: new Date('2024-01-02'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.stats.update.mockResolvedValue(mockUpdatedStats);

      const result = await repository.update(
        'user-123',
        updateDto,
        GameMode.DAILY,
      );

      expect(result).toEqual({
        ...mockUpdatedStats,
        lastWinDate: mockUpdatedStats.lastWinDate,
      });
      expect(mockPrismaService.stats.update).toHaveBeenCalledWith({
        where: { userId_mode: { userId: 'user-123', mode: GameMode.DAILY } },
        data: {
          currentStreak: 6,
          bestStreak: 10,
          roundDistribution: [1, 2, 3, 5, 5, 0, 0],
          totalGames: { increment: 1 },
          totalWins: { increment: 1 },
          lastWinDate: updateDto.lastWinDate,
        },
      });
    });

    it('should update stats for a loss', async () => {
      const updateDto = {
        currentStreak: 0,
        bestStreak: 10,
        roundDistribution: [1, 2, 3, 5, 5, 0, 1],
        won: false,
      };

      const mockUpdatedStats: Stats = {
        userId: 'user-123',
        mode: GameMode.DAILY,
        currentStreak: 0,
        bestStreak: 10,
        totalGames: 22,
        totalWins: 16,
        roundDistribution: [1, 2, 3, 5, 5, 0, 1],
        lastWinDate: new Date('2024-01-02'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.stats.update.mockResolvedValue(mockUpdatedStats);

      const result = await repository.update(
        'user-123',
        updateDto,
        GameMode.DAILY,
      );

      expect(result).toEqual({
        ...mockUpdatedStats,
        lastWinDate: mockUpdatedStats.lastWinDate,
      });
      expect(mockPrismaService.stats.update).toHaveBeenCalledWith({
        where: { userId_mode: { userId: 'user-123', mode: GameMode.DAILY } },
        data: {
          currentStreak: 0,
          bestStreak: 10,
          roundDistribution: [1, 2, 3, 5, 5, 0, 1],
          totalGames: { increment: 1 },
          totalWins: undefined,
        },
      });
    });
  });
});
