import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class SubmitQuizAnswerDto {
  @ApiProperty({ description: 'The question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: 'The selected answer index (0-3)',
    minimum: 0,
    maximum: 3,
  })
  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex: number;
}
