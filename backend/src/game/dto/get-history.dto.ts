import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { Transform } from 'class-transformer';
import { IsNumber, Min, Max, IsEnum, IsString, IsDate } from 'class-validator';
import { GameMode, GameStatus } from '@prisma/client';

export class GetHistoryDto {
  @ApiPropertyOptional({
    description: 'The game mode to filter history by (e.g. daily, all)',
    enum: GameMode,
  })
  @IsNotNullableOptional()
  @IsEnum(GameMode)
  mode?: GameMode;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    type: Number,
    default: 1,
  })
  @IsNotNullableOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Number(value))
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    type: Number,
    default: 10,
  })
  @IsNotNullableOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  limit?: number;

  @ApiPropertyOptional({
    description: 'Search by track name, artist name, or album name',
    type: String,
  })
  @IsNotNullableOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by game status',
    enum: GameStatus,
  })
  @IsNotNullableOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiPropertyOptional({
    description: 'Filter from date (ISO 8601)',
    type: Date,
  })
  @IsNotNullableOptional()
  @IsDate()
  // Not sure if this is necessary, better safe than sorry to ensure we get a Date object
  @Transform(({ value }) => new Date(value))
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter to date (ISO 8601)',
    type: Date,
  })
  @IsNotNullableOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  to?: Date;
}
