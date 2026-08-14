import { ApiProperty } from '@nestjs/swagger';

export class DemoTrackEntity {
  @ApiProperty({
    description: 'Spotify track id',
  })
  id: string;

  @ApiProperty({
    description: 'The playlist this track was drawn from',
  })
  playlistSlug: string;

  @ApiProperty({
    description: 'The name of the track',
  })
  name: string;

  @ApiProperty({
    description: 'The artists, joined',
  })
  artistName: string;

  @ApiProperty({
    description: 'The URL of the album image',
  })
  albumImageUrl: string;

  @ApiProperty({
    description: 'Audio preview served by Spotify’s CDN',
  })
  previewUrl: string;

  @ApiProperty({
    description: 'Position in the chart at the time it was fetched',
  })
  position: number;

  @ApiProperty({
    description: 'When the scheduled refresh last wrote this row',
  })
  fetchedAt: Date;
}
