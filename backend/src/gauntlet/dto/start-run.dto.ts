import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { GauntletDifficulty } from '@prisma/client';

export class StartRunDto {
  @ApiProperty({ description: 'The playlist ID to pick tracks from' })
  @IsString()
  playlistId: string;

  @ApiProperty({
    description: 'Difficulty level (controls snippet duration)',
    enum: GauntletDifficulty,
  })
  @IsEnum(GauntletDifficulty)
  difficulty: GauntletDifficulty;
}
