import { ApiProperty } from '@nestjs/swagger';

export class StreakStatusDto {
  @ApiProperty({ description: 'Current daily streak (consecutive win days)' })
  currentStreak: number;

  @ApiProperty({ description: 'Best daily streak ever' })
  bestStreak: number;

  @ApiProperty({ description: 'Whether the user has won today' })
  playedToday: boolean;

  @ApiProperty({
    description: 'Whether a gap exists and streak could be lost',
  })
  streakAtRisk: boolean;

  @ApiProperty({
    description: 'Whether the user can save their streak with freezes',
  })
  canSaveStreak: boolean;

  @ApiProperty({ description: 'Number of missed days in the gap' })
  gapDays: number;

  @ApiProperty({ description: 'Number of freezes available' })
  freezesAvailable: number;

  @ApiProperty({
    description: 'Number of freezes needed to bridge the gap',
  })
  freezeCost: number;

  @ApiProperty({
    description: 'Whether the user is trusted (can earn freezes)',
  })
  isTrusted: boolean;
}
