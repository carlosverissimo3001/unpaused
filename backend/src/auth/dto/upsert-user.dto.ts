import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertUserDto {
  @ApiProperty({ description: 'Unique identifier for the user on Spotify' })
  spotifyUserId: string;

  @ApiProperty({ description: 'Display name of the user' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Indicates if the user is trusted' })
  isTrusted?: boolean;

  @ApiPropertyOptional({ description: 'URL of the user avatar' })
  avatarUrl?: string;
}
