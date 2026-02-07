import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { Transform } from 'class-transformer';
import { IsNumber, Min, Max, IsEnum } from 'class-validator';
import { GameMode } from '@prisma/client';

export class GetHistoryDto {
  @ApiPropertyOptional({
    description: 'The game mode to filter history by (e.g. daily, all)',
    enum: GameMode,
  })
  @IsNotNullableOptional()
  @IsEnum(GameMode)
  mode?: GameMode;

  @ApiPropertyOptional({
    description: 'The limit of the history',
    type: Number,
  })
  @IsNotNullableOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  limit?: number;

  @ApiPropertyOptional({
    description: 'The offset of the history',
    type: Number,
  })
  @IsNotNullableOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  offset?: number;
}
