import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { Transform } from 'class-transformer';
import { toBoolean } from '../../utils/transformers/toBoolean.transform';
import { IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class GetHistoryDto {
  @ApiPropertyOptional({
    description: 'Whether the game is daily',
    type: Boolean,
  })
  @IsNotNullableOptional()
  @IsBoolean()
  @Transform(({ obj }) => toBoolean(obj.isDaily))
  isDaily?: boolean;

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
