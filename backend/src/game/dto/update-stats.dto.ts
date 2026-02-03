import { ApiProperty } from "@nestjs/swagger";

export class UpdateStatsDto {
    @ApiProperty({ description: "The current streak" })
    currentStreak: number;
    
    @ApiProperty({ description: "The best streak" })
    bestStreak: number;
    
    @ApiProperty({ description: "The total games" })
    won: boolean;
    
    @ApiProperty({ description: "The score of this game" })
    score: number;
    
    @ApiProperty({ description: "The score distribution" })
    scoreDistribution: number[];
}