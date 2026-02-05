import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';

export class TokenLoginDto {
  @ApiProperty({ description: 'Spotify access token' })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({
    description: 'Spotify refresh token (optional)',
    type: String,
  })
  @IsNotNullableOptional()
  @IsString()
  refreshToken?: string;
}
