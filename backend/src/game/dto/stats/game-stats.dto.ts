import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from '@prisma/client';
import { GameStatsEntity } from '../../entities/game-stats.entity';

/**
 * What the tally counts. The daily counts days, so a second win today adds
 * nothing; free play counts wins, so it does. Same column, different meaning,
 * and the client needs to know which it is holding before it labels it.
 */
export enum StatsUnit {
  DAYS = 'DAYS',
  WINS = 'WINS',
}

export class GameStatsDto {
  @ApiProperty({ description: 'The tally in progress: a streak or a run' })
  current: number;

  @ApiProperty({ description: 'The longest this tally has ever been' })
  best: number;

  @ApiProperty({ description: 'What the tally counts', enum: StatsUnit })
  unit: StatsUnit;

  @ApiProperty({ description: 'The total games' })
  totalGames: number;

  @ApiProperty({ description: 'The total wins' })
  totalWins: number;

  @ApiProperty({
    description: 'The round distribution',
    example: [0, 0, 0, 0, 0, 0, 0],
    type: Number,
    isArray: true,
  })
  roundDistribution: number[];

  @ApiProperty({ description: 'The game mode', enum: GameMode })
  mode: GameMode;

  @ApiProperty({ description: 'The win rate', example: 0.5 })
  winRate: number;

  @ApiProperty({ description: 'The average score', example: 3.5 })
  averageScore: number;

  static fromEntity(entity: GameStatsEntity): GameStatsDto {
    const totalGames = Math.max(1, entity.totalGames);

    // Score logic: won on round 1 = 6 points, round 2 = 5 points, ..., round 6 = 1 point, lost = 0 points
    const totalScore = entity.roundDistribution.reduce((acc, count, index) => {
      const scorePerWin = index < 6 ? 6 - index : 0;
      return acc + count * scorePerWin;
    }, 0);

    return {
      current: entity.currentStreak,
      best: entity.bestStreak,
      unit: entity.mode === GameMode.DAILY ? StatsUnit.DAYS : StatsUnit.WINS,
      totalGames: entity.totalGames,
      totalWins: entity.totalWins,
      roundDistribution: entity.roundDistribution,
      mode: entity.mode,
      winRate: Math.round((entity.totalWins / totalGames) * 100) / 100,
      averageScore: Math.round((totalScore / totalGames) * 100) / 100,
    };
  }
}
