import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackDto {
  @ApiProperty({ description: 'The ID of the track' })
  readonly id: string;

  @ApiProperty({ description: 'The name of the track' })
  readonly name: string;

  @ApiProperty({
    description:
      'Normalized name for search/matching (no weird Unicode/spacing)',
  })
  readonly normalizedName: string;

  @ApiProperty({ type: String, isArray: true })
  readonly artists: string[];

  @ApiProperty({ description: 'The name of the album' })
  readonly albumName: string;

  @ApiProperty({ description: 'The ID of the album' })
  readonly albumId: string;

  @ApiProperty({ description: 'The image URL of the track' })
  readonly imageUrl: string;

  @ApiProperty({ description: 'The duration of the track in milliseconds' })
  readonly durationMs: number;

  @ApiProperty({ description: 'The external URL of the track' })
  readonly externalUrl: string;

  @ApiPropertyOptional({
    description: 'The preview URL of the track',
    nullable: true,
    type: String,
  })
  readonly previewUrl?: string;

  @ApiProperty()
  readonly isPlayable: boolean;

  @ApiProperty({ description: 'The primary artist for easier comparison' })
  readonly primaryArtist: string;

  @ApiPropertyOptional({
    description: 'The release year of the track',
    nullable: true,
  })
  readonly releaseYear?: number;

  @ApiPropertyOptional({
    description: 'International Standard Recording Code',
    nullable: true,
    type: String,
  })
  readonly isrc?: string;

  @ApiProperty({
    description: 'All artist names for the track',
    type: String,
    isArray: true,
  })
  readonly allArtists: string[];
}
