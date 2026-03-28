import { AuthService } from '@auth/services/auth.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateStreakQuestionDto } from '../dto/create-streak-question.dto';
import { QuizNextResponseDto } from '../dto/quiz-question.dto';
import { QuizResultDto } from '../dto/quiz-result.dto';
import { StreakQuestionDto } from '../dto/streak-question.dto';
import { UpdateStreakQuestionDto } from '../dto/update-streak-question.dto';
import { StreakQuizRepository } from '../repositories/streak-quiz.repository';

const MAX_FREEZES = 5;

@Injectable()
export class StreakQuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly quizRepository: StreakQuizRepository,
  ) {}

  async getNextQuestion(sessionId: string): Promise<QuizNextResponseDto> {
    const user = await this.authService.getUserBySessionId(sessionId);

    if (user.streakFreezes >= MAX_FREEZES) {
      return {
        question: null,
        done: true,
        freezesAvailable: user.streakFreezes,
      };
    }

    const question = await this.quizRepository.findNextForUser(
      user.answeredQuestionIds,
    );

    if (!question) {
      return {
        question: null,
        done: true,
        freezesAvailable: user.streakFreezes,
      };
    }

    return {
      question: {
        id: question.id,
        question: question.question,
        options: question.options,
        category: question.category,
      },
      done: false,
      freezesAvailable: user.streakFreezes,
    };
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    answerIndex: number,
  ): Promise<QuizResultDto> {
    const user = await this.authService.getUserBySessionId(sessionId);

    const question = await this.quizRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const correct = answerIndex === question.correctAnswerIndex;
    let freezeEarned = false;

    if (correct) {
      if (user.streakFreezes < MAX_FREEZES) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            streakFreezes: { increment: 1 },
            answeredQuestionIds: { push: questionId },
          },
        });
        freezeEarned = true;
      } else {
        // At max, still mark as answered so it doesn't reappear
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            answeredQuestionIds: { push: questionId },
          },
        });
      }
    }

    return {
      correct,
      freezeEarned,
      freezesAvailable: freezeEarned
        ? user.streakFreezes + 1
        : user.streakFreezes,
      correctAnswerIndex: question.correctAnswerIndex,
    };
  }

  // --- Admin methods ---

  async listAllQuestions(): Promise<StreakQuestionDto[]> {
    const questions = await this.quizRepository.findAll();
    return questions.map(StreakQuestionDto.fromEntity);
  }

  async createQuestion(
    sessionId: string,
    dto: CreateStreakQuestionDto,
  ): Promise<StreakQuestionDto> {
    const user = await this.authService.getUserBySessionId(sessionId);

    if (dto.options.length !== 4) {
      throw new BadRequestException('Exactly 4 options are required');
    }

    const question = await this.quizRepository.create({
      question: dto.question,
      options: dto.options,
      correctAnswerIndex: dto.correctAnswerIndex,
      category: dto.category ?? 'general',
      context: dto.context ?? null,
      isActive: true,
      addedBy: user.id,
    });

    return StreakQuestionDto.fromEntity(question);
  }

  async updateQuestion(
    id: string,
    dto: UpdateStreakQuestionDto,
  ): Promise<StreakQuestionDto> {
    const existing = await this.quizRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    if (dto.options && dto.options.length !== 4) {
      throw new BadRequestException('Exactly 4 options are required');
    }

    const updated = await this.quizRepository.update(id, dto);
    return StreakQuestionDto.fromEntity(updated);
  }

  async deleteQuestion(id: string): Promise<void> {
    const existing = await this.quizRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Question not found');
    }
    await this.quizRepository.softDelete(id);
  }
}
