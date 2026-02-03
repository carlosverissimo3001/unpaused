import { ApiProperty } from "@nestjs/swagger";
import { GameMode } from "@prisma/client";

export class GameStatsEntity {
    @ApiProperty({ description: "The ID of the stats" })    
    id: string;

    @ApiProperty({ description: "The ID of the user" })
    userId: string;
    
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
}