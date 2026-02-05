import { GameMode } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export class GetStatsDto {
    @ApiProperty({ description: "The game mode", enum: GameMode })
    @IsEnum(GameMode)
    mode: GameMode;
}