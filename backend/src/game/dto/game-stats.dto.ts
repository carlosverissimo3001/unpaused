import { ApiProperty } from "@nestjs/swagger";
import { GameMode } from "@prisma/client";
import { GameStatsEntity } from "../entities/game-stats.entity";

export class GameStatsDto  {
    @ApiProperty({ description: "The current streak" })
    currentStreak: number;

    @ApiProperty({ description: "The best streak" })
    bestStreak: number;

    @ApiProperty({ description: "The total games" })
    totalGames: number;

    @ApiProperty({ description: "The total wins" })
    totalWins: number;

    @ApiProperty({ description: "The total score" })
    totalScore: number;

    @ApiProperty({ description: "The score distribution", example: [0, 0, 0, 0, 0, 0], type: Number, isArray: true })
    scoreDistribution: number[];

    @ApiProperty({ description: "The game mode", enum: GameMode })
    mode: GameMode;

    @ApiProperty({ description: "The win rate", example: 0.5 })
    winRate: number;    

    @ApiProperty({ description: "The average score", example: 3.5 })
    averageScore: number;

    static fromEntity(entity: GameStatsEntity): GameStatsDto {
        const totalGames = Math.max(1, entity.totalGames);
        
        return {
          currentStreak: entity.currentStreak,
          bestStreak: entity.bestStreak,
          totalGames: entity.totalGames,
          totalWins: entity.totalWins,
          totalScore: entity.totalScore,
          scoreDistribution: entity.scoreDistribution,
          mode: entity.mode,
          winRate: entity.totalWins / totalGames,
          averageScore: entity.totalScore / totalGames,
        };
      }
}