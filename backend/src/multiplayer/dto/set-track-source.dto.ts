import { ApiProperty } from '@nestjs/swagger';
import { TrackSource } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetTrackSourceDto {
  @ApiProperty({
    enum: TrackSource,
    description: 'Where the room should draw its songs from',
  })
  @IsEnum(TrackSource)
  trackSource: TrackSource;
}
