import { GameMode } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class GetStatsDto {
    @ApiProperty({ description: "The game mode", enum: GameMode })
    mode: GameMode;
}