import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SpotifyOAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from Spotify',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
  })
  @IsString()
  state: string;

  @ApiPropertyOptional({
    description: 'Error message if authorization failed.',
  })
  @IsOptional()
  @IsString()
  error?: string | null;

  @ApiPropertyOptional({
    description: 'Spotify-specific parameter added during OAuth flow',
  })
  @IsOptional()
  @IsString()
  ubi?: string | null;
}
