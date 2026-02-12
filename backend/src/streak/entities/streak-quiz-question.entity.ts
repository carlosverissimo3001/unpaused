import { ApiProperty } from '@nestjs/swagger';

export class StreakQuizQuestionEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ type: [String] })
  options: string[];

  @ApiProperty()
  correctAnswerIndex: number;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false, nullable: true })
  context: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  addedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
