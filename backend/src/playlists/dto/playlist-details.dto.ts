import { ApiProperty } from "@nestjs/swagger";
import { PlaylistImageDto, PlaylistOwnerDto } from "./playlist.dto";
import { PlaylistTrackDto } from "./track.dto";

export class PlaylistDetailsDto {
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

  @ApiProperty({ type: [PlaylistTrackDto] })
  tracks: PlaylistTrackDto[];
}
