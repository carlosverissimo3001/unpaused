import { ApiProperty } from "@nestjs/swagger";

export class ArtistDto {
  @ApiProperty({ example: "0du5cEVh5yTK9QJze8zA0C" })
  id: string;

  @ApiProperty({ example: "Bruno Mars" })
  name: string;
}

export class AlbumImageDto {
  @ApiProperty({ example: "https://i.scdn.co/image/ab67616d0000b273..." })
  url: string;

  @ApiProperty({ example: 640, nullable: true })
  height: number | null;

  @ApiProperty({ example: 640, nullable: true })
  width: number | null;
}

export class AlbumDto {
  @ApiProperty({ example: "4aawyAB9vmqN3uQ7FjRGTy" })
  id: string;

  @ApiProperty({ example: "Doo-Wops & Hooligans" })
  name: string;

  @ApiProperty({ type: [AlbumImageDto] })
  images: AlbumImageDto[];
}

export class TrackDto {
  @ApiProperty({ example: "7ouMYWpwJ422jRcDASAM9z" })
  id: string;

  @ApiProperty({ example: "Grenade" })
  name: string;

  @ApiProperty({ type: [ArtistDto] })
  artists: ArtistDto[];

  @ApiProperty({ type: AlbumDto })
  album: AlbumDto;

  @ApiProperty({ example: 223946, description: "Duration in milliseconds" })
  durationMs: number;

  @ApiProperty({ example: "https://open.spotify.com/track/7ouMYWpwJ422jRcDASAM9z" })
  externalUrl: string;

  @ApiProperty({ example: "https://p.scdn.co/mp3-preview/...", nullable: true })
  previewUrl: string | null;

  @ApiProperty({ example: false, description: "Whether track is playable" })
  isPlayable: boolean;
}

export class PlaylistTrackDto {
  @ApiProperty({ type: TrackDto })
  track: TrackDto;

  @ApiProperty({ example: "2023-12-15T10:30:00Z" })
  addedAt: string;
}
