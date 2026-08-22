import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackMetadataVo } from '../vo/track-metadata.vo';

export class UpsertTrackDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  artistName: string;

  @ApiPropertyOptional()
  albumImageUrl?: string;

  @ApiPropertyOptional()
  albumUrl?: string;

  @ApiPropertyOptional()
  albumName?: string;

  @ApiPropertyOptional()
  releaseYear?: number;

  @ApiPropertyOptional()
  isrc?: string;

  @ApiPropertyOptional()
  previewUrl?: string;

  @ApiPropertyOptional()
  previewRef?: string;

  @ApiPropertyOptional()
  metadata?: TrackMetadataVo;

  @ApiProperty()
  allArtists: string[];
}
