import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthMeResponseDto {
  @ApiProperty({ description: 'Unique identifier for the user' })
  spotifyUserId: string;

  @ApiProperty({ description: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Avatar URL, if available' })
  avatarUrl?: string;

  @ApiProperty({ example: false })
  isTrusted: boolean;

  @ApiProperty({ example: false })
  isAdmin: boolean;
}
