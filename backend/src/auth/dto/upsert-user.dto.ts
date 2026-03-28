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

  @ApiPropertyOptional({
    description:
      "The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code.",
  })
  country?: string;
}
