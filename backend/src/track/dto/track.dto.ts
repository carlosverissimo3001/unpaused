import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackDto {
  @ApiProperty({ description: 'The ID of the track' })
  id: string;

  @ApiProperty({ description: 'The name of the track' })
  name: string;

  @ApiProperty({
    description:
      'Normalized name for search/matching (no weird Unicode/spacing)',
  })
  normalizedName: string;

  @ApiProperty({ type: String, isArray: true })
  artists: string[];

  @ApiProperty({ description: 'The name of the album' })
  albumName: string;

  @ApiProperty({ description: 'The ID of the album' })
  albumId: string;

  @ApiProperty({ description: 'The image URL of the track' })
  imageUrl: string;

  @ApiProperty({ description: 'The duration of the track in milliseconds' })
  durationMs: number;

  @ApiProperty({ description: 'The external URL of the track' })
  externalUrl: string;

  @ApiPropertyOptional({
    description: 'The preview URL of the track',
    nullable: true,
    type: String,
  })
  previewUrl?: string;

  @ApiProperty()
  isPlayable: boolean;

  @ApiProperty({ description: 'The primary artist for easier comparison' })
  primaryArtist: string;

  @ApiPropertyOptional({
    description: 'The release year of the track',
    nullable: true,
  })
  releaseYear?: number;
}
