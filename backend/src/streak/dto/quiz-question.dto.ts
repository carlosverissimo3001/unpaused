import { ApiProperty } from '@nestjs/swagger';

export class QuizQuestionDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'The question text' })
  question: string;

  @ApiProperty({ description: 'Answer options', type: [String] })
  options: string[];

  @ApiProperty({ description: 'Question category' })
  category: string;
}

export class QuizNextResponseDto {
  @ApiProperty({
    description: 'The next question, or null if no more questions available',
    type: QuizQuestionDto,
    nullable: true,
  })
  question: QuizQuestionDto | null;

  @ApiProperty({
    description: 'Whether there are no more questions to answer',
  })
  done: boolean;

  @ApiProperty({ description: 'Current number of freezes' })
  freezesAvailable: number;
}
