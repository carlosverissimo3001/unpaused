import { GameMode, Stats } from '@prisma/client';
import { UpdateStatsDto } from '../dto/stats/update-stats.dto';
import { PrismaService } from '@prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { GameStatsEntity } from '../entities/game-stats.entity';

@Injectable()
export class GameStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string, mode: GameMode): Promise<GameStatsEntity> {
    const stats = await this.prisma.stats.findUnique({
      where: { userId_mode: { userId, mode } },
    });
    return stats ? this.fromPrisma(stats) : this.defaultEntity(mode);
  }

  async upsert(userId: string, mode: GameMode): Promise<GameStatsEntity> {
    const stats = await this.prisma.stats.upsert({
      where: { userId_mode: { userId, mode } },
      create: { userId, mode },
      update: {},
    });
    return this.fromPrisma(stats);
  }

  async update(
    userId: string,
    params: UpdateStatsDto,
    mode: GameMode,
  ): Promise<GameStatsEntity> {
    const stats = await this.prisma.stats.update({
      where: { userId_mode: { userId, mode } },
      data: this.mapUpdateData(params),
    });
    return this.fromPrisma(stats);
  }

  private mapUpdateData(params: UpdateStatsDto) {
    const { currentStreak, bestStreak, roundDistribution, won, lastWinDate } =
      params;
    return {
      currentStreak,
      bestStreak,
      roundDistribution,
      totalGames: { increment: 1 },
      totalWins: won ? { increment: 1 } : undefined,
      ...(lastWinDate !== undefined ? { lastWinDate } : {}),
    };
  }

  fromPrisma(prisma: Stats): GameStatsEntity {
    return {
      ...prisma,
      lastWinDate: prisma.lastWinDate ?? undefined,
    };
  }

  private defaultEntity(mode: GameMode): GameStatsEntity {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalGames: 0,
      totalWins: 0,
      // Index 0-5 for rounds 1-6, index 6 for failures
      roundDistribution: [0, 0, 0, 0, 0, 0, 0],
      mode,
      lastWinDate: undefined,
      userId: '',
    };
  }
}
