import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TrackOptionDto {
    @ApiProperty({ description: "The ID of the track" })
    id: string;
  
    @ApiProperty({ description: "The name of the track" })
    name: string;

    @ApiProperty({ description: "Normalized name for search/matching" })
    normalizedName: string;
  
    @ApiProperty({ description: "The artist of the track" })
    artist: string;

    @ApiProperty({ description: "Normalized artist for search/matching" })
    normalizedArtist: string;
  
    @ApiPropertyOptional({ description: "The album image URL of the track", type: String })
    albumImageUrl?: string;
  
    @ApiPropertyOptional({ description: "The album name of the track", type: String })
    albumName?: string;
  
    @ApiPropertyOptional({ description: "The album URL of the track", type: String })
    albumUrl?: string;
  
    @ApiPropertyOptional({ description: "The release year of the track", type: Number })
    releaseYear?: number;
  }