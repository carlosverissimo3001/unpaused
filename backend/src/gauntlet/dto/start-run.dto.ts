import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GauntletDifficulty, GauntletSource } from '@prisma/client';
import {
  ForbiddenWhen,
  RequiredWhen,
} from '@utils/decorators/requiredWhen.decorator';

export class StartRunDto {
  @ApiProperty({
    description: 'Where the run draws its tracks from',
    enum: GauntletSource,
  })
  @IsEnum(GauntletSource)
  source: GauntletSource;

  @ApiPropertyOptional({
    description:
      'The playlist to draw from. Required when the source is a playlist.',
  })
  @RequiredWhen((o) => o.source === GauntletSource.PLAYLIST)
  playlistId?: string;

  @ApiPropertyOptional({
    description:
      'Narrows a curated run to one group. Without it the run draws from the whole pool.',
  })
  @ForbiddenWhen((o) => o.source !== GauntletSource.CURATED)
  trackGroupId?: string;

  @ApiProperty({
    description: 'Difficulty level (controls snippet duration)',
    enum: GauntletDifficulty,
  })
  @IsEnum(GauntletDifficulty)
  difficulty: GauntletDifficulty;
}
