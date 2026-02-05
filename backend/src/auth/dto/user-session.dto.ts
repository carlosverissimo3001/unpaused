import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { SpotifyTokenDto } from './spotify/spotify-token.dto';

export class UserSessionDto {
  @ApiProperty({ description: 'Unique identifier for the user session' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Spotify user ID associated with the session' })
  @IsString()
  spotifyUserId: string;

  @ApiProperty({ description: 'Display name of the Spotify user' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Indicates if the user is trusted' })
  @IsBoolean()
  isTrusted: boolean;

  @ApiProperty({ description: 'Timestamp when the session was created' })
  @IsNumber()
  createdAt: number;

  @ApiProperty({
    description: 'Spotify tokens associated with the session',
  })
  tokens: SpotifyTokenDto;
}
