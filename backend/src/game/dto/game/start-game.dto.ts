import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { toBoolean } from '@utils/transformers/toBoolean.transform';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';

export class StartGameDto {
  @ApiPropertyOptional({
    description: 'The ID of the playlist to start the game with',
  })
  @IsNotNullableOptional()
  @IsString()
  @IsNotEmpty()
  playlistId?: string;

  @ApiPropertyOptional({ description: 'Whether the game is daily' })
  @IsNotNullableOptional()
  @IsBoolean()
  @Transform(({ obj }) => toBoolean(obj.isDaily))
  isDaily?: boolean;
}
