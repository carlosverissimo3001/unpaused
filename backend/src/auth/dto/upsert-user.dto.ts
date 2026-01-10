import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsBoolean } from "class-validator";

export class UpsertUserDto {
    @ApiProperty({ example: "spotify_user_123" })
    @IsString()
    spotifyUserId: string;
    
    @ApiProperty({ example: "John Doe" })
    @IsString()
    displayName: string;
    
    @ApiProperty({ example: false })
    @IsBoolean()
    isTrusted: boolean;
}