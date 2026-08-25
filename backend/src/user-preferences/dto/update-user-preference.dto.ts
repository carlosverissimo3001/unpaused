import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsIanaTimezone } from '@utils/decorators/isIanaTimezone.decorator';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { TransformToArray } from '../../utils/transformers/toArray.transform';

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({
    description: 'Show progressively blurred album art hint',
  })
  @IsOptional()
  @IsBoolean()
  showAlbumHint?: boolean;

  @ApiPropertyOptional({
    description: 'Show genre, decade, and other text hints',
  })
  @IsOptional()
  @IsBoolean()
  showTextHints?: boolean;

  @ApiPropertyOptional({ description: 'Reduce motion and animations' })
  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @ApiPropertyOptional({ description: 'Show guess history during gameplay' })
  @IsOptional()
  @IsBoolean()
  showGuessHistory?: boolean;

  @ApiPropertyOptional({
    description: 'Show this player by name on public leaderboards',
  })
  @IsOptional()
  @IsBoolean()
  showStatsToOthers?: boolean;

  @ApiPropertyOptional({
    description:
      'Playlist IDs to source daily challenge songs from. Must have at least one entry when provided.',
    type: [String],
  })
  @IsNotNullableOptional()
  @TransformToArray()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one playlist must be selected' })
  @IsString({ each: true })
  dailyChallengePlaylists?: string[];

  @ApiPropertyOptional({
    description: 'IANA timezone string (e.g. America/New_York)',
  })
  @IsNotNullableOptional()
  @IsIanaTimezone()
  timezone?: string;
}
