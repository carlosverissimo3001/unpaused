// https://developer.spotify.com/documentation/web-api/tutorials/code-flow

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

// Check "Request Access Token" section
export class SpotifyTokenResponseDto {
  @ApiProperty({
    description:
      'An access token that can be provided in subsequent calls, for example to Spotify Web API services.n',
  })
  @IsString()
  access_token: string;

  @ApiProperty({
    description:
      'A space-separated list of scopes that have been granted for this access token.',
  })
  @IsString()
  scope: string;

  @ApiProperty({
    description: 'How the access token may be used: always "Bearer".',
  })
  @IsString()
  token_type: string;

  @ApiProperty({
    description:
      'The time period (in seconds) for which the access token is valid.',
  })
  @IsNumber()
  expires_in: number;

  @ApiProperty({
    description:
      'A security credential that allows client applications to obtain new access tokens without requiring users to reauthorize the application.',
  })
  @IsString()
  refresh_token: string;
}
