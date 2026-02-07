import { ApiProperty } from '@nestjs/swagger';

export class SpotifyTokenDto {
  @ApiProperty({
    description: 'Spotify access token',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Spotify refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token lifetime in seconds as returned by Spotify',
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Unix timestamp (ms) when the access token expires',
  })
  expiresAt: number;
}
