import { Injectable } from '@nestjs/common';
import { GameMode } from '@prisma/client';
import { GameStatsRepository } from '../repositories/game-stats.repository';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GAME_MAX_ROUNDS } from '../../consts';

interface UpdateGameStatsParams {
  userId: string;
  lastGameRound: number;
  mode: GameMode;
}

/**
 * Service responsible for all game statistics operations.
 * Owns all interactions with GameStatsRepository.
 *
 * Note: Daily streak logic lives in StreakService.
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
   * Updates ALL mode stats after a game ends.
   * Must run within a @Transactional() boundary so it participates in the same transaction.
   */
  async updateGameStats(params: UpdateGameStatsParams): Promise<void> {
    const { userId, lastGameRound } = params;
    await this.updateAllModeStats(userId, lastGameRound);
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
