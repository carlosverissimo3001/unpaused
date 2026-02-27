import { Injectable } from '@nestjs/common';
import { GameMode } from '@prisma/client';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { GameStatsRepository } from '../repositories/game-stats.repository';
import { UpdateDailyStatsParams, UpdateGameStatsParams } from '../types';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GAME_MAX_ROUNDS } from '../../consts';

/**
 * Service responsible for all game statistics operations.
 * Owns all interactions with GameStatsRepository.
 */
@Injectable()
export class GameStatsService {
  constructor(private readonly gameStatsRepository: GameStatsRepository) {}

  /**
   * Gets stats for a user by mode
   */
  async getStats(userId: string, mode: GameMode): Promise<GameStatsDto> {
    const stats = await this.gameStatsRepository.findByUserId(userId, mode);
    return GameStatsDto.fromEntity(stats);
  }

  /**
   * Updates stats for the user after a game ends.
   * Must run within a @Transactional() boundary so it participates in the same transaction.
   *
   * Always updates ALL mode stats, and additionally updates DAILY mode stats if applicable.
   */
  async updateGameStats(params: UpdateGameStatsParams): Promise<void> {
    const { userId, lastGameRound, mode } = params;

    await this.updateAllModeStats(userId, lastGameRound);

    if (mode === GameMode.DAILY) {
      await this.updateDailyModeStats(userId, lastGameRound);
    }
  }

  /**
   * Updates ALL mode stats (simple win/loss streak, resets on loss)
   */
  private async updateAllModeStats(
    userId: string,
    lastGameRound: number,
  ): Promise<void> {
    const stats = await this.gameStatsRepository.upsert(userId, GameMode.ALL);
    const won = lastGameRound < GAME_MAX_ROUNDS;

    const newStreak = won ? stats.currentStreak + 1 : 0;

    const dist = this.updateRoundDistribution(
      stats.roundDistribution ?? [0, 0, 0, 0, 0, 0, 0],
      lastGameRound,
    );

    await this.gameStatsRepository.update(
      userId,
      {
        currentStreak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        roundDistribution: dist,
        won,
      },
      GameMode.ALL,
    );
  }

  /**
   * Updates DAILY mode stats with date-aware streak logic
   */
  private async updateDailyModeStats(
    userId: string,
    lastGameRound: number,
  ): Promise<void> {
    const dailyStats = await this.gameStatsRepository.upsert(
      userId,
      GameMode.DAILY,
    );
    const won = lastGameRound < GAME_MAX_ROUNDS;

    const dailyDist = this.updateRoundDistribution(
      dailyStats.roundDistribution ?? [0, 0, 0, 0, 0, 0, 0],
      lastGameRound,
    );

    return won
      ? this.updateDailyStatsForWin({ userId, dailyStats, dailyDist })
      : this.updateDailyStatsForLoss({ userId, dailyStats, dailyDist });
  }

  /**
   * Updates daily stats when the user wins
   * Implements date-aware streak logic with freeze support
   */
  private async updateDailyStatsForWin(
    params: UpdateDailyStatsParams,
  ): Promise<void> {
    const { userId, dailyStats, dailyDist } = params;

    const today = startOfDay(new Date());
    const lastWin = dailyStats.lastWinDate
      ? startOfDay(dailyStats.lastWinDate)
      : undefined;

    const newDailyStreak = this.calculateDailyStreak(
      dailyStats.currentStreak,
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

  /**
   * Updates daily stats when the user loses
   * Daily is one-shot, so a loss always resets the streak to 0
   */
  private async updateDailyStatsForLoss(
    params: UpdateDailyStatsParams,
  ): Promise<void> {
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
   * Calculates the new daily streak based on last win date
   * Handles three cases:
   * 1. Already won today → don't double-count
   * 2. Won yesterday → consecutive day, increment streak
   * 3. Gap exists → reset to 1 (unless freeze was applied by StreakService)
   */
  private calculateDailyStreak(currentStreak: number, lastWin?: Date): number {
    const today = startOfDay(new Date());

    if (!lastWin) {
      // First win ever
      return 1;
    }

    const daysDiff = differenceInCalendarDays(today, lastWin);

    if (daysDiff === 0) {
      // Already won today — don't double-count, maintain current streak
      return currentStreak;
    }

    if (daysDiff === 1) {
      // Won yesterday → consecutive day
      return currentStreak + 1;
    }

    // Gap exists → reset to 1
    // Note: If freeze was used, lastWinDate was set to yesterday by StreakService.useFreeze()
    return 1;
  }

  /**
   * Updates the round distribution array
   * Losses go to index 6
   */
  private updateRoundDistribution(
    distribution: number[],
    lastGameRound: number,
  ): number[] {
    const dist = [...distribution];
    dist[lastGameRound] = (dist[lastGameRound] ?? 0) + 1;
    return dist;
  }
}
