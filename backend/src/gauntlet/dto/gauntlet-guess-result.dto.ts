import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GauntletRunStatus } from '@prisma/client';

export class GauntletGuessResultDto {
  @ApiProperty({
    description: 'Whether the guess was correct',
  })
  correct: boolean;

  @ApiProperty({
    description: 'Whether the run is over (wrong guess or skip)',
  })
  runOver: boolean;

  @ApiProperty({
    description: 'Current score (consecutive correct guesses)',
  })
  score: number;

  @ApiProperty({
    description: 'Status of the run after this guess',
    enum: GauntletRunStatus,
  })
  status: GauntletRunStatus;

  @ApiPropertyOptional({
    description: 'Preview URL for the next track (if run continues)',
    type: String,
  })
  nextPreviewUrl?: string;

  @ApiPropertyOptional({
    description: 'Snippet duration in seconds for the next track',
    type: Number,
  })
  nextSnippetDuration?: number;
}
