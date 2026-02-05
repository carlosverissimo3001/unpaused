import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';

export class AuthMeResponseDto {
  @ApiProperty({ example: 'spotify_user_123' })
  @IsString()
  spotifyUserId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isTrusted: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  isAdmin: boolean;
}
