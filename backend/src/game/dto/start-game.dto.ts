import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class StartGameDto {
    @ApiProperty({ description: "The ID of the playlist to start the game with" })
    @IsString()
    @IsNotEmpty()
    playlistId: string;
  }
  