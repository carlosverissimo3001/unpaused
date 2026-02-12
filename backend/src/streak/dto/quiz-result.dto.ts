import { ApiProperty } from '@nestjs/swagger';

export class QuizResultDto {
  @ApiProperty({ description: 'Whether the answer was correct' })
  correct: boolean;

  @ApiProperty({ description: 'Whether a freeze was earned from this answer' })
  freezeEarned: boolean;

  @ApiProperty({ description: 'Current number of freezes after this answer' })
  freezesAvailable: number;

  @ApiProperty({
    description: 'The correct answer index (shown after answering)',
  })
  correctAnswerIndex: number;
}
