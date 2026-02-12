import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ description: 'Unique identifier for the user' })
  id: string;

  @ApiProperty({ description: 'Unique identifier for the user on Spotify' })
  spotifyUserId: string;

  @ApiProperty({ description: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ description: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Indicates if the user is trusted' })
  isTrusted: boolean;

  @ApiProperty({ description: 'Indicates if the user is an admin' })
  isAdmin: boolean;

  @ApiProperty({ description: 'Date when the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the user was last updated' })
  updatedAt: Date;
}
