import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CallbackDto {
  @ApiProperty({ description: 'The code from the Spotify OAuth callback' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'The state from the Spotify OAuth callback' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'The error from the Spotify OAuth callback' })
  @IsString()
  error: string;
}
