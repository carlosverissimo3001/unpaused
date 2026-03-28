import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsISO31661Alpha2,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SpotifyImageDto {
  @ApiProperty({ description: 'The image URL' })
  url: string;

  @ApiPropertyOptional({
    description: 'The image height in pixels, or null if unknown',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  height?: number | null;

  @ApiPropertyOptional({
    description: 'The image width in pixels, or null if unknown',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
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
  @IsOptional()
  @IsArray()
  @Type(() => SpotifyImageDto)
  @ValidateNested({ each: true })
  images?: SpotifyImageDto[] | null;

  @ApiPropertyOptional({
    description:
      "The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code. This field is only available when the current user has granted access to the user-read-private scope.",
    type: String,
  })
  @IsString()
  @IsOptional()
  @IsISO31661Alpha2()
  country?: string | null;
}
