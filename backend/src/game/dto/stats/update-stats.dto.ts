import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatsDto {
  @ApiProperty({ description: 'The current streak' })
  currentStreak: number;

  @ApiProperty({ description: 'The best streak' })
  bestStreak: number;

  @ApiProperty({ description: 'Whether the game was won' })
  won: boolean;

  @ApiProperty({ description: 'The round distribution' })
  roundDistribution: number[];

  @ApiProperty({ description: 'Last win date for daily mode', required: false })
  lastWinDate?: Date;
}
