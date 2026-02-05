import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'spotify_user_123' })
  @IsString()
  spotifyUserId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isTrusted: boolean;
}
