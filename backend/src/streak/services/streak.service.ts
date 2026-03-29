import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AuthService } from '@auth/services/auth.service';
import { GameMode, StreakFreezeUsage } from '@prisma/client';
import { GameStatsRepository } from '../../game/repositories/game-stats.repository';
import { GameStatsEntity } from '../../game/entities/game-stats.entity';
import { UserPreferencesService } from '../../user-preferences/services/user-preferences.service';
import { StreakStatusDto } from '../dto/streak-status.dto';
import { GAME_MAX_ROUNDS } from '../../consts';
import {
  startOfDay,
  differenceInCalendarDays,
  subDays,
  addDays,
} from 'date-fns';
import { TZDate } from '@date-fns/tz';

@Injectable()
export class StreakService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    // TODO: We should use a gameStatsService instead of directly depending on the repository, to encapsulate stats logic better
    private readonly gameStatsRepository: GameStatsRepository,
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  async getStreakStatus(sessionId: string): Promise<StreakStatusDto> {
    const user = await this.authService.getUserBySessionId(sessionId);
    const stats = await this.gameStatsRepository.findByUserId(
      user.id,
      GameMode.DAILY,
    );

    const timezone = await this.userPreferencesService.getUserTimezone(user.id);
    const today = startOfDay(new TZDate(new Date(), timezone));
    const lastWin = stats.lastWinDate
      ? startOfDay(new TZDate(stats.lastWinDate, timezone))
      : null;

    let playedToday = false;
    let gapDays = 0;
    let streakAtRisk = false;

    if (lastWin) {
      const daysDiff = differenceInCalendarDays(today, lastWin);

      if (daysDiff === 0) {
        playedToday = true;
      } else if (daysDiff === 1) {
        // Won yesterday, streak continues if they win today
      } else if (daysDiff > 1) {
        gapDays = daysDiff - 1;
        if (stats.currentStreak > 0) {
          streakAtRisk = true;
        }
      }
    }

    const canSaveStreak =
      streakAtRisk && user.isTrusted && user.streakFreezes >= gapDays;

    return {
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      playedToday,
      streakAtRisk,
      canSaveStreak,
      gapDays,
      freezesAvailable: user.streakFreezes,
      freezeCost: gapDays,
      isTrusted: user.isTrusted,
    };
  }

  /**
   * Returns freeze usages for a user within a date range (for history display)
   */
  async getFreezeUsagesInRange(
    userId: string,
    from: string,
    to: string,
  ): Promise<StreakFreezeUsage[]> {
    const timezone = await this.userPreferencesService.getUserTimezone(userId);
    const fromDate = startOfDay(new TZDate(from, timezone));
    const toDateExclusive = addDays(startOfDay(new TZDate(to, timezone)), 1);

    return this.prisma.streakFreezeUsage.findMany({
      where: {
        userId,
        coveredFrom: { gte: fromDate },
        coveredTo: { lt: toDateExclusive },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Updates daily streak after a game ends.
   * Must be called within a @Transactional() boundary.
   */
  async updateDailyStreak(
    userId: string,
    lastGameRound: number,
  ): Promise<void> {
    const dailyStats = await this.gameStatsRepository.upsert(
      userId,
      GameMode.DAILY,
    );
    const won = lastGameRound < GAME_MAX_ROUNDS;
    const timezone = await this.userPreferencesService.getUserTimezone(userId);

    const dailyDist = this.updateRoundDistribution(
      dailyStats.roundDistribution ?? [0, 0, 0, 0, 0, 0, 0],
      lastGameRound,
    );

    return won
      ? this.updateDailyStatsForWin({ userId, dailyStats, dailyDist, timezone })
      : this.updateDailyStatsForLoss({ userId, dailyStats, dailyDist });
  }

  private async updateDailyStatsForWin(params: {
    userId: string;
    dailyStats: GameStatsEntity;
    dailyDist: number[];
    timezone: string;
  }): Promise<void> {
    const { userId, dailyStats, dailyDist, timezone } = params;

    const today = startOfDay(new TZDate(new Date(), timezone));
    const lastWin = dailyStats.lastWinDate
      ? startOfDay(new TZDate(dailyStats.lastWinDate, timezone))
      : undefined;

    const newDailyStreak = this.calculateDailyStreak(
      dailyStats.currentStreak,
      timezone,
      lastWin,
    );

    await this.gameStatsRepository.update(
      userId,
      {
        currentStreak: newDailyStreak,
        bestStreak: Math.max(dailyStats.bestStreak, newDailyStreak),
        roundDistribution: dailyDist,
        won: true,
        lastWinDate: today,
      },
      GameMode.DAILY,
    );
  }

  private async updateDailyStatsForLoss(params: {
    userId: string;
    dailyStats: GameStatsEntity;
    dailyDist: number[];
  }): Promise<void> {
    const { userId, dailyStats, dailyDist } = params;

    await this.gameStatsRepository.update(
      userId,
      {
        currentStreak: 0,
        bestStreak: dailyStats.bestStreak,
        roundDistribution: dailyDist,
        won: false,
      },
      GameMode.DAILY,
    );
  }

  /**
   * Calculates the new daily streak based on last win date.
   * 1. Already won today → don't double-count
   * 2. Won yesterday → consecutive day, increment streak
   * 3. Gap exists → reset to 1 (unless freeze was applied by useFreeze())
   */
  private calculateDailyStreak(
    currentStreak: number,
    timezone: string,
    lastWin?: Date,
  ): number {
    const today = startOfDay(new TZDate(new Date(), timezone));

    if (!lastWin) {
      return 1;
    }

    const daysDiff = differenceInCalendarDays(
      today,
      startOfDay(new TZDate(lastWin, timezone)),
    );

    if (daysDiff === 0) {
      return currentStreak;
    }

    if (daysDiff === 1) {
      return currentStreak + 1;
    }

    return 1;
  }

  private updateRoundDistribution(
    distribution: number[],
    lastGameRound: number,
  ): number[] {
    const dist = [...distribution];
    dist[lastGameRound] = (dist[lastGameRound] ?? 0) + 1;
    return dist;
  }

  async useFreeze(sessionId: string): Promise<StreakStatusDto> {
    // Note: Controller already validates user is trusted via TrustedUserGuard
    const user = await this.authService.getUserBySessionId(sessionId);

    const stats = await this.gameStatsRepository.findByUserId(
      user.id,
      GameMode.DAILY,
    );

    const timezone = await this.userPreferencesService.getUserTimezone(user.id);
    const today = startOfDay(new TZDate(new Date(), timezone));
    const lastWin = stats.lastWinDate
      ? startOfDay(new TZDate(stats.lastWinDate, timezone))
      : null;

    if (!lastWin || stats.currentStreak === 0) {
      throw new BadRequestException('No streak to save');
    }

    const daysDiff = differenceInCalendarDays(today, lastWin);
    if (daysDiff <= 1) {
      throw new BadRequestException('Streak is not at risk');
    }

    const gapDays = daysDiff - 1;
    if (user.streakFreezes < gapDays) {
      throw new BadRequestException(
        `Not enough freezes: need ${gapDays}, have ${user.streakFreezes}`,
      );
    }

    // Bridge the gap: frozen days count as streak days (like Duolingo)
    const yesterday = subDays(today, 1);
    const newStreak = stats.currentStreak + gapDays;
    const newBest = Math.max(stats.bestStreak, newStreak);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { streakFreezes: { decrement: gapDays } },
      }),
      this.prisma.stats.update({
        where: { userId_mode: { userId: user.id, mode: GameMode.DAILY } },
        data: {
          lastWinDate: yesterday,
          currentStreak: newStreak,
          bestStreak: newBest,
        },
      }),
      this.prisma.streakFreezeUsage.create({
        data: {
          userId: user.id,
          freezesUsed: gapDays,
          gapDays,
          streakAtTime: stats.currentStreak,
          coveredFrom: addDays(lastWin, 1),
          coveredTo: yesterday,
        },
      }),
    ]);

    return this.getStreakStatus(sessionId);
  }
}
