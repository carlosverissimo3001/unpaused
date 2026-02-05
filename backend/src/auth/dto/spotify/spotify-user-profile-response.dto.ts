import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotNullableOptional } from '../../../utils/decorators/notNullableOptional.decorator';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

export class SpotifyImageDto {
  @ApiProperty({ description: 'The image URL' })
  url: string;

  @ApiPropertyOptional({
    description: 'The image height in pixels, or null if unknown',
    type: Number,
  })
  @IsNumber()
  @IsNotNullableOptional()
  height?: number | null;

  @ApiPropertyOptional({
    description: 'The image width in pixels, or null if unknown',
    type: Number,
  })
  @IsNumber()
  @IsNotNullableOptional()
  width?: number | null;
}

export class SpotifyUserProfileResponseDto {
  @ApiProperty({ description: 'The Spotify user ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The display name of the user' })
  @IsString()
  display_name: string;

  @ApiPropertyOptional({
    description: 'Array of images associated with the user',
    type: SpotifyImageDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  images: SpotifyImageDto[];
}
