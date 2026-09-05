import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { Transform } from 'class-transformer';
import { toBoolean } from '@utils/transformers/toBoolean.transform';

export class SubmitGauntletGuessDto {
  @ApiPropertyOptional({
    description: 'The ID of the track to guess',
    type: String,
  })
  @IsNotNullableOptional()
  @IsString()
  trackId?: string;

  @ApiPropertyOptional({
    description: 'Whether the current guess is a skip (ends the run)',
    type: Boolean,
  })
  @IsNotNullableOptional()
  @Transform(({ obj }) => toBoolean(obj.skip))
  skip?: boolean = false;

  @ApiPropertyOptional({ description: 'Track name', type: String })
  @IsNotNullableOptional()
  @IsString()
  trackName?: string;

  @ApiPropertyOptional({ description: 'Artist name', type: String })
  @IsNotNullableOptional()
  @IsString()
  artistName?: string;

  @ApiPropertyOptional({
    description:
      'ISRC of the guessed recording, when the catalogue supplies one',
    type: String,
  })
  @IsNotNullableOptional()
  @IsString()
  isrc?: string;

  @ApiPropertyOptional({ description: 'Album name', type: String })
  @IsNotNullableOptional()
  @IsString()
  albumName?: string;
}
