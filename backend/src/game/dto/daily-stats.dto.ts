import { ApiProperty } from "@nestjs/swagger";

export class DailyStatsDto {
  @ApiProperty({ description: "Current streak (consecutive days played)" })
  currentStreak: number;

  @ApiProperty({ description: "Best streak ever" })
  bestStreak: number;

  @ApiProperty({ description: "Total daily games played" })
  totalGames: number;

  @ApiProperty({ description: "Total wins" })
  totalWins: number;

  @ApiProperty({ description: "Win rate 0-1" })
  winRate: number;

  @ApiProperty({ description: "Average score per game" })
  averageScore: number;

  @ApiProperty({
    description: "Wins per round [round1, round2, ..., round6]",
    type: [Number],
  })
  scoreDistribution: number[];
}
