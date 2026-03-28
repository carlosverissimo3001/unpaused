import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarSource } from '@prisma/client';

export class AuthMeResponseDto {
  @ApiProperty({ description: 'Unique identifier for the user' })
  spotifyUserId: string;

  @ApiProperty({ description: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({
    description:
      'Effective avatar URL for display (resolves to custom or Spotify)',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Cloudinary URL of the custom avatar, if uploaded',
  })
  customAvatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Spotify avatar URL from the user profile',
  })
  spotifyAvatarUrl?: string;

  @ApiProperty({
    enum: AvatarSource,
    description: 'Which avatar source is currently active',
  })
  avatarSource: AvatarSource;

  @ApiProperty({ example: false })
  isTrusted: boolean;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiPropertyOptional({
    description:
      "The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code.",
  })
  country?: string;
}
