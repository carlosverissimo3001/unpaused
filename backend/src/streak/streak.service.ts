import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AuthService } from '@auth/services/auth.service';
import { GameMode } from '@prisma/client';
import { GameStatsRepository } from '../game/repositories/game-stats.repository';
import { StreakStatusDto } from './dto/streak-status.dto';
import {
  startOfDay,
  differenceInCalendarDays,
  subDays,
  addDays,
} from 'date-fns';

@Injectable()
export class StreakService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly gameStatsRepository: GameStatsRepository,
  ) {}

  async getStreakStatus(sessionId: string): Promise<StreakStatusDto> {
    const user = await this.authService.getUserBySessionId(sessionId);
    const stats = await this.gameStatsRepository.findByUserId(
      user.id,
      GameMode.DAILY,
    );

    const today = startOfDay(new Date());
    const lastWin = stats.lastWinDate ? startOfDay(stats.lastWinDate) : null;

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

  async useFreeze(sessionId: string): Promise<StreakStatusDto> {
    // Note: Controller already validates user is trusted via TrustedUserGuard
    const user = await this.authService.getUserBySessionId(sessionId);

    const stats = await this.gameStatsRepository.findByUserId(
      user.id,
      GameMode.DAILY,
    );

    const today = startOfDay(new Date());
    const lastWin = stats.lastWinDate ? startOfDay(stats.lastWinDate) : null;

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
