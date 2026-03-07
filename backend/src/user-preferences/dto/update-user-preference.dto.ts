import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

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
}
