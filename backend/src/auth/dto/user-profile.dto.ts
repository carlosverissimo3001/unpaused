import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ description: 'The Spotify user ID' })
  id: string;

  @ApiProperty({ description: 'Display name of the user' })
  displayName: string;

  @ApiPropertyOptional({
    description: 'URL of the user avatar',
  })
  avatarUrl?: string;
}
