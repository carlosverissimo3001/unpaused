import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

export class GetLeaderboardDto {
  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'alltime'],
    default: 'alltime',
    description: 'Time period for the leaderboard',
  })
  @IsNotNullableOptional()
  @IsEnum(['daily', 'weekly', 'alltime'])
  period?: LeaderboardPeriod = 'alltime';

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsNotNullableOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsNotNullableOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
