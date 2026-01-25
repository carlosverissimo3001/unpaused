import { ApiProperty } from "@nestjs/swagger";
import { PlaylistDto } from "./playlist.dto";

export class PlaylistsResponseDto {
    @ApiProperty({description: "The playlists", type: PlaylistDto, isArray: true })
    items: PlaylistDto[];
  
    @ApiProperty({ description: "The total number of playlists" })
    total: number;
  
    @ApiProperty({ description: "The limit of the playlists" })
    limit: number;
  
    @ApiProperty({ description: "The offset of the playlists" })
    offset: number;
  }
  