import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { GameMode } from '@prisma/client';

export class StartGameDto {
  @ApiPropertyOptional({
    description: 'The ID of the playlist to start the game with',
  })
  @IsNotNullableOptional()
  @IsString()
  @IsNotEmpty()
  playlistId?: string;

  @ApiProperty({
    description: 'The game mode to start (all or daily)',
    enum: GameMode,
  })
  @IsEnum(GameMode)
  mode: GameMode;
}
