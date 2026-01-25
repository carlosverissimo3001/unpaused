import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TrackDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({type: String, isArray: true})
  artists: string[];

  @ApiProperty()
  albumName: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  durationMs: number;

  @ApiProperty()
  externalUrl: string;

  @ApiPropertyOptional({ type: String })
  previewUrl?: string;

  @ApiProperty()
  isPlayable: boolean;

  @ApiProperty({ description: "The primary artist for easier comparison" })
  primaryArtist: string;

  @ApiPropertyOptional({ description: "Popularity score 0-100 for game balancing" })
  popularity?: number;

  @ApiProperty({ description: "Is the track explicit" })
  isExplicit: boolean;
}
