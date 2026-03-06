import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackMetadataVo } from '../vo/track-metadata.vo';

export class TrackEntity {
  @ApiProperty({
    description: 'The unique identifier for the track',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the track',
  })
  name: string;

  @ApiProperty({
    description: 'The name of the artist',
  })
  artistName: string;

  @ApiPropertyOptional({
    description: 'The URL of the album image',
    type: String,
  })
  albumImageUrl?: string;

  @ApiPropertyOptional({
    description: 'The name of the album',
    type: String,
  })
  albumName?: string;

  @ApiPropertyOptional({
    description: 'The URL of the album',
    type: String,
  })
  albumUrl?: string;

  @ApiPropertyOptional({
    description: 'The year the track was released',
    type: Number,
  })
  releaseYear?: number;

  @ApiPropertyOptional({
    description: 'The URL of the track preview',
    type: String,
  })
  previewUrl?: string;

  @ApiProperty({
    description: 'Timestamp of when the track was last scraped',
  })
  lastScrapedAt: Date;

  @ApiProperty({
    description: 'Timestamp of when the track was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of when the track was last updated',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Metadata for the track',
    type: TrackMetadataVo,
  })
  metadata?: TrackMetadataVo;

  @ApiProperty({
    description: 'All artist names for the track',
    type: String,
    isArray: true,
  })
  allArtists: string[];

  constructor(data: Partial<TrackEntity>) {
    Object.assign(this, data);
  }
}
