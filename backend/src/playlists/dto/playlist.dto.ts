import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PlaylistDto {
  @ApiProperty({ description: "The ID of the playlist" })
  id: string;

  @ApiProperty({ description: "The name of the playlist" })
  name: string;

  @ApiPropertyOptional({ description: "The description of the playlist", nullable: true })
  description?: string;

  @ApiProperty({ description: "The image URL of the playlist" })
  imageUrl: string;

  @ApiProperty({ description: "The owner of the playlist" })
  owner: string;

  @ApiProperty({ description: "The total number of tracks in the playlist" })
  totalTracks: number;

  @ApiProperty({ description: "Whether the playlist is public" })
  isPublic: boolean;

  @ApiProperty({ description: "The external URL of the playlist" })
  externalUrl: string;
}
