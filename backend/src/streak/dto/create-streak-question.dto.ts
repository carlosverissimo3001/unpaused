import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateStreakQuestionDto {
  @ApiProperty({ description: 'The question text' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Answer options (4 choices)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    description: 'Index of the correct answer (0-3)',
    minimum: 0,
    maximum: 3,
  })
  @IsInt()
  @Min(0)
  @Max(3)
  correctAnswerIndex: number;

  @ApiProperty({ description: 'Question category', default: 'general' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Private context/note about the inside joke',
    required: false,
  })
  @IsString()
  @IsOptional()
  context?: string;
}
