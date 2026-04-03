import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GauntletDifficulty } from '@prisma/client';
import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';

export class GetGauntletHistoryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsNotNullableOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsNotNullableOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by difficulty',
    enum: GauntletDifficulty,
  })
  @IsNotNullableOptional()
  @IsEnum(GauntletDifficulty)
  difficulty?: GauntletDifficulty;
}
