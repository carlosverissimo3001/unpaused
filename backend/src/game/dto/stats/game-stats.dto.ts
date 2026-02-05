import { ApiProperty } from "@nestjs/swagger";
import { GameMode } from "@prisma/client";
import { GameStatsEntity } from "../../entities/game-stats.entity";

export class GameStatsDto  {
    @ApiProperty({ description: "The current streak" })
    currentStreak: number;

    @ApiProperty({ description: "The best streak" })
    bestStreak: number;

    @ApiProperty({ description: "The total games" })
    totalGames: number;

    @ApiProperty({ description: "The total wins" })
    totalWins: number;

    @ApiProperty({ description: "The round distribution", example: [0, 0, 0, 0, 0, 0, 0], type: Number, isArray: true })
    roundDistribution: number[];

    @ApiProperty({ description: "The game mode", enum: GameMode })
    mode: GameMode;

    @ApiProperty({ description: "The win rate", example: 0.5 })
    winRate: number;    

    @ApiProperty({ description: "The average score", example: 3.5 })
    averageScore: number;

    static fromEntity(entity: GameStatsEntity): GameStatsDto {
      const totalGames = Math.max(1, entity.totalGames);

      // Score logic: won on round 1 = 6 points, round 2 = 5 points, ..., round 6 = 1 point, lost = 0 points
      const totalScore = entity.roundDistribution.reduce((acc, count, index) => {
        const scorePerWin = index < 6 ? 6 - index : 0;
        return acc + (count * scorePerWin);
      }, 0);
      
      return {
        currentStreak: entity.currentStreak,
        bestStreak: entity.bestStreak,
        totalGames: entity.totalGames,
        totalWins: entity.totalWins,
        roundDistribution: entity.roundDistribution,
        mode: entity.mode,
        winRate: Math.round((entity.totalWins / totalGames) * 100) / 100,
        averageScore: Math.round((totalScore / totalGames) * 100) / 100,
      };
    }
}