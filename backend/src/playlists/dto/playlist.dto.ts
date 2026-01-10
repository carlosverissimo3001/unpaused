import { ApiProperty } from "@nestjs/swagger";

export class PlaylistImageDto {
  @ApiProperty({ example: "https://i.scdn.co/image/ab67616d0000b273..." })
  url: string;

  @ApiProperty({ example: 640, nullable: true })
  height: number | null;

  @ApiProperty({ example: 640, nullable: true })
  width: number | null;
}

export class PlaylistOwnerDto {
  @ApiProperty({ example: "spotify_user_123" })
  id: string;

  @ApiProperty({ example: "John Doe" })
  displayName: string;
}

export class PlaylistSummaryDto {
  @ApiProperty({ example: "37i9dQZF1DXcBWIGoYBM5M" })
  id: string;

  @ApiProperty({ example: "Today's Top Hits" })
  name: string;

  @ApiProperty({ example: "The hottest 50 tracks right now", nullable: true })
  description: string | null;

  @ApiProperty({ type: [PlaylistImageDto] })
  images: PlaylistImageDto[];

  @ApiProperty({ type: PlaylistOwnerDto })
  owner: PlaylistOwnerDto;

  @ApiProperty({ example: 50 })
  totalTracks: number;

  @ApiProperty({ example: true })
  public: boolean;

  @ApiProperty({ example: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" })
  externalUrl: string;
}

export class PlaylistsResponseDto {
  @ApiProperty({ type: [PlaylistSummaryDto] })
  items: PlaylistSummaryDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
