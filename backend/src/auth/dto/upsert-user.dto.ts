import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';

export class UpsertUserDto {
  @ApiProperty({ example: 'spotify_user_123' })
  @IsString()
  spotifyUserId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: false })
  @IsNotNullableOptional()
  @IsBoolean()
  isTrusted?: boolean;
}
