import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarSource } from '@prisma/client';

export class UserEntity {
  @ApiProperty({ description: 'Unique identifier for the user' })
  id: string;

  @ApiProperty({ description: 'Unique identifier for the user on Spotify' })
  spotifyUserId: string;

  @ApiProperty({ description: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ description: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Cloudinary URL of uploaded custom avatar',
  })
  customAvatarUrl?: string;

  @ApiProperty({ enum: AvatarSource })
  avatarSource: AvatarSource;

  @ApiProperty({ description: 'Indicates if the user is trusted' })
  isTrusted: boolean;

  @ApiProperty({ description: 'Indicates if the user is an admin' })
  isAdmin: boolean;

  @ApiProperty({ description: 'Date when the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the user was last updated' })
  updatedAt: Date;
}
