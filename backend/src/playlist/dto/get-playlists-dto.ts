import { ApiPropertyOptional } from '@nestjs/swagger';
import { toBoolean } from '../../utils/transformers/toBoolean.transform';
import { Transform } from 'class-transformer';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { PLAYLIST_SORT_BY } from '../consts';

export class GetPlaylistsDto {
  @ApiPropertyOptional({ example: 20 })
  @IsNotNullableOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Number(value))
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNotNullableOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  offset?: number;

  @ApiPropertyOptional({ description: 'Include only public playlists' })
  @IsNotNullableOptional()
  @IsBoolean()
  @Transform(({ obj }) => toBoolean(obj.onlyPublic))
  onlyPublic?: boolean = false;

  @ApiPropertyOptional({ description: 'Include only private playlists' })
  @IsNotNullableOptional()
  @IsBoolean()
  @Transform(({ obj }) => toBoolean(obj.onlyPrivate))
  onlyPrivate?: boolean = false;

  @ApiPropertyOptional({
    description: 'Sort playlists by field',
    enum: PLAYLIST_SORT_BY,
  })
  @IsNotNullableOptional()
  @IsEnum(PLAYLIST_SORT_BY)
  sortBy?: PLAYLIST_SORT_BY = PLAYLIST_SORT_BY.DEFAULT;
}
