import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StreakQuizQuestion } from '@prisma/client';
import { StreakQuizQuestionEntity } from './entities/streak-quiz-question.entity';

@Injectable()
export class StreakQuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<StreakQuizQuestionEntity[]> {
    const questions = await this.prisma.streakQuizQuestion.findMany({
      where: { isActive: true },
    });
    return questions.map(this.fromPrisma);
  }

  async findAll(): Promise<StreakQuizQuestionEntity[]> {
    const questions = await this.prisma.streakQuizQuestion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return questions.map(this.fromPrisma);
  }

  async findById(id: string): Promise<StreakQuizQuestionEntity | null> {
    const question = await this.prisma.streakQuizQuestion.findUnique({
      where: { id },
    });
    return question ? this.fromPrisma(question) : null;
  }

  /**
   * Find a random active question that the user hasn't already answered correctly.
   */
  async findNextForUser(
    answeredQuestionIds: string[],
  ): Promise<StreakQuizQuestionEntity | null> {
    const questions = await this.prisma.streakQuizQuestion.findMany({
      where: {
        isActive: true,
        ...(answeredQuestionIds.length > 0
          ? { id: { notIn: answeredQuestionIds } }
          : {}),
      },
    });

    if (questions.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * questions.length);
    return this.fromPrisma(questions[randomIndex]);
  }

  async create(
    data: Omit<StreakQuizQuestionEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StreakQuizQuestionEntity> {
    const question = await this.prisma.streakQuizQuestion.create({ data });
    return this.fromPrisma(question);
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        StreakQuizQuestionEntity,
        | 'question'
        | 'options'
        | 'correctAnswerIndex'
        | 'category'
        | 'context'
        | 'isActive'
      >
    >,
  ): Promise<StreakQuizQuestionEntity> {
    const question = await this.prisma.streakQuizQuestion.update({
      where: { id },
      data,
    });
    return this.fromPrisma(question);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.streakQuizQuestion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private fromPrisma(q: StreakQuizQuestion): StreakQuizQuestionEntity {
    return { ...q };
  }
}
