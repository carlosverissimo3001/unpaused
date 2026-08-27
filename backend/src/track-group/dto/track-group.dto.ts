import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackGroupType } from '@prisma/client';

export class TrackGroupDto {
  @ApiProperty({ description: 'Stable id, used to start a round' })
  id: string;

  @ApiProperty({
    enum: TrackGroupType,
    description: 'Which axis this groups by',
  })
  type: TrackGroupType;

  @ApiProperty({ example: '1980s', description: 'What the tile is called' })
  name: string;

  @ApiProperty({
    example: '1980s',
    description: 'In the URL, so a shared link survives a rename',
  })
  slug: string;

  @ApiProperty({ example: 490 })
  trackCount: number;

  @ApiPropertyOptional({
    description:
      'Album art of the best known song in the group, absent if none of them has any',
  })
  imageUrl?: string;
}
