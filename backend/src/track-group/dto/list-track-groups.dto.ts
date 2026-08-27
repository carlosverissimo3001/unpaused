import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrackGroupType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListTrackGroupsDto {
  @ApiPropertyOptional({
    enum: TrackGroupType,
    description: 'Which axis to list. Only DECADE is populated today.',
  })
  @IsOptional()
  @IsEnum(TrackGroupType)
  type?: TrackGroupType;
}
