import { ApiProperty } from '@nestjs/swagger';
import { GauntletDifficulty, GauntletRunStatus } from '@prisma/client';

export class GauntletRunStateDto {
  @ApiProperty({ description: 'The gauntlet run ID' })
  runId: string;

  @ApiProperty({
    description: 'Current score (consecutive correct guesses)',
  })
  score: number;

  @ApiProperty({
    description: 'Status of the run',
    enum: GauntletRunStatus,
  })
  status: GauntletRunStatus;

  @ApiProperty({
    description: 'Difficulty level of the run',
    enum: GauntletDifficulty,
  })
  difficulty: GauntletDifficulty;

  @ApiProperty({
    description: 'Preview URL for the current track',
  })
  previewUrl: string;

  @ApiProperty({
    description: 'Snippet duration in seconds for the current track',
  })
  snippetDuration: number;
}
