import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LastfmDataVo {
  @ApiProperty({
    description: 'List of tags associated with the track',
    type: String,
    isArray: true,
  })
  tags: string[];

  @ApiPropertyOptional({
    description: 'Number of times the track has been played',
    type: Number,
  })
  playcount?: number;

  @ApiProperty({
    description: 'Timestamp of when the data was fetched',
    type: String,
  })
  fetchedAt: string;

  constructor(data: Partial<LastfmDataVo>) {
    Object.assign(this, data);
  }
}

export class TrackMetadataVo {
  @ApiPropertyOptional({
    description: 'Last.fm data for the track',
    type: LastfmDataVo,
  })
  lastfm?: LastfmDataVo;

  constructor(data: Partial<TrackMetadataVo>) {
    Object.assign(this, data);
  }
}
