import { ApiProperty } from "@nestjs/swagger";

export class UpdateStatsDto {
    @ApiProperty({ description: "The current streak" })
    currentStreak: number;
    
    @ApiProperty({ description: "The best streak" })
    bestStreak: number;
    
    @ApiProperty({ description: "The total games" })
    won: boolean;
    
    @ApiProperty({ description: "The round distribution" })
    roundDistribution: number[];
}