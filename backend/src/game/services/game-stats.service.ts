import { Injectable } from '@nestjs/common';
import { GameMode } from '@prisma/client';
import { GameStatsRepository } from '../repositories/game-stats.repository';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GameStatsEntity } from '../entities/game-stats.entity';
import { GAME_MAX_ROUNDS } from '../../consts';
import { UserPreferencesService } from '../../user-preferences/services/user-preferences.service';
import { nextDailyStreak, nextRun } from '../../streak/utils/daily-streak';

interface RecordFinishedGameParams {
  userId: string;
  lastGameRound: number;
  mode: GameMode;
}

/**
 * Every write to the stats table goes through here.
 *
 * Two modes are counted and they count different things: DAILY keeps a streak
 * of days, ALL keeps a run of consecutive wins. Multiplayer results belong to
 * their room and a gauntlet run has its own table with its own scoring, so
 * neither writes a row — folding them in here would flatten one and duplicate
 * the other.
 */
@Injectable()
export class GameStatsService {
  constructor(
    private readonly gameStatsRepository: GameStatsRepository,
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  /**
   * Gets stats for a user by mode
   */
  async getStats(userId: string, mode: GameMode): Promise<GameStatsDto> {
    const stats = await this.gameStatsRepository.findByUserId(userId, mode);
    return GameStatsDto.fromEntity(stats);
  }

  /**
   * The daily row itself, for the freeze flows that need lastWinDate — the
   * one field a DTO has no reason to carry.
   */
  async getDailyStats(userId: string): Promise<GameStatsEntity> {
    return this.gameStatsRepository.findByUserId(userId, GameMode.DAILY);
  }

  /**
   * Records a finished game against the mode it was actually played in.
   * Must run within a @Transactional() boundary so it participates in the same transaction.
   */
  async recordFinishedGame(params: RecordFinishedGameParams): Promise<void> {
    const { userId, mode, lastGameRound } = params;

    if (mode === GameMode.DAILY) {
      return this.recordDaily(userId, lastGameRound);
    }
    if (mode === GameMode.ALL) {
      return this.recordFreePlay(userId, lastGameRound);
    }
  }

  /** A run of consecutive wins, which a single loss ends. */
  private async recordFreePlay(
    userId: string,
    lastGameRound: number,
  ): Promise<void> {
    const stats = await this.gameStatsRepository.upsert(userId, GameMode.ALL);
    const won = lastGameRound < GAME_MAX_ROUNDS;
    const run = nextRun(stats.currentStreak, won);

    await this.gameStatsRepository.update(
      userId,
      {
        currentStreak: run,
        bestStreak: Math.max(stats.bestStreak, run),
        roundDistribution: this.withRound(
          stats.roundDistribution,
          lastGameRound,
        ),
        won,
      },
      GameMode.ALL,
    );
  }

  /** A streak of days, which only a win extends and only a win dates. */
  private async recordDaily(
    userId: string,
    lastGameRound: number,
  ): Promise<void> {
    const stats = await this.gameStatsRepository.upsert(userId, GameMode.DAILY);
    const won = lastGameRound < GAME_MAX_ROUNDS;
    const distribution = this.withRound(stats.roundDistribution, lastGameRound);

    if (!won) {
      await this.gameStatsRepository.update(
        userId,
        {
          currentStreak: 0,
          bestStreak: stats.bestStreak,
          roundDistribution: distribution,
          won: false,
        },
        GameMode.DAILY,
      );
      return;
    }

    const timezone = await this.userPreferencesService.getUserTimezone(userId);
    const now = new Date();
    const streak = nextDailyStreak({
      currentStreak: stats.currentStreak,
      timezone,
      now,
      lastWin: stats.lastWinDate,
    });

    await this.gameStatsRepository.update(
      userId,
      {
        currentStreak: streak,
        bestStreak: Math.max(stats.bestStreak, streak),
        roundDistribution: distribution,
        won: true,
        lastWinDate: now,
      },
      GameMode.DAILY,
    );
  }

  /** Rounds 1-6 land in 0-5; a loss lands in 6. */
  private withRound(distribution: number[], lastGameRound: number): number[] {
    const dist = [...(distribution ?? [0, 0, 0, 0, 0, 0, 0])];
    dist[lastGameRound] = (dist[lastGameRound] ?? 0) + 1;
    return dist;
  }
}
