import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreakQuizQuestionEntity } from '../entities/streak-quiz-question.entity';

export class StreakQuestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ type: String, isArray: true })
  options: string[];

  @ApiProperty()
  correctAnswerIndex: number;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional({ type: String })
  context?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  addedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: StreakQuizQuestionEntity): StreakQuestionDto {
    return {
      ...entity,
      context: entity.context ?? undefined,
    };
  }
}
