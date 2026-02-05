import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from '@prisma/client';

export class GameStatsEntity {
  @ApiProperty({ description: 'The ID of the user' })
  userId: string;

  @ApiProperty({ description: 'The current streak' })
  currentStreak: number;

  @ApiProperty({ description: 'The best streak' })
  bestStreak: number;

  @ApiProperty({ description: 'The total games' })
  totalGames: number;

  @ApiProperty({ description: 'The total wins' })
  totalWins: number;

  @ApiProperty({
    description: 'The round distribution of games',
    example: [0, 0, 0, 0, 0, 0, 0],
    type: Number,
    isArray: true,
  })
  roundDistribution: number[];

  @ApiProperty({ description: 'The game mode', enum: GameMode })
  mode: GameMode;
}
