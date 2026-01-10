import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsObject, IsString } from "class-validator";
import { SpotifyTokens } from "../services/spotify.service";

export class UserSessionDto {
    @ApiProperty({ example: "session_1234567890" })
    @IsString()
    sessionId: string;

    @ApiProperty({ example: "spotify_user_123" })
    @IsString()
    spotifyUserId: string;

    @ApiProperty({ example: "John Doe" })
    @IsString()
    displayName: string;

    @ApiProperty({ example: false })
    @IsBoolean()
    isTrusted: boolean;

    @ApiProperty({ example: 1715328000 })
    @IsNumber()
    createdAt: number;

    @ApiProperty({ example: {
        accessToken: "access_token",
        refreshToken: "refresh_token",
        expiresAt: 1715328000,
    } })
    @IsObject()
    tokens: SpotifyTokens;
}