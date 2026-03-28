import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SessionGuard } from '@utils/guards/session-guard';
import { TrustedUserGuard } from '@utils/guards/trusted-user-guard';
import { QuizNextResponseDto } from '../dto/quiz-question.dto';
import { QuizResultDto } from '../dto/quiz-result.dto';
import { StreakStatusDto } from '../dto/streak-status.dto';
import { SubmitQuizAnswerDto } from '../dto/submit-quiz-answer.dto';
import { StreakQuizService } from '../services/streak-quiz.service';
import { StreakService } from '../services/streak.service';

@ApiTags('Api')
@Controller('streak')
@UseGuards(SessionGuard)
export class StreakController {
  constructor(
    private readonly streakService: StreakService,
    private readonly quizService: StreakQuizService,
  ) {}

  @Get('status')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get streak status including freeze info' })
  @ApiResponse({ status: 200, type: StreakStatusDto })
  async getStatus(@SessionId() sessionId: string): Promise<StreakStatusDto> {
    return this.streakService.getStreakStatus(sessionId);
  }

  @Post('use-freeze')
  @UseGuards(TrustedUserGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Apply streak freezes to bridge a gap' })
  @ApiResponse({ status: 200, type: StreakStatusDto })
  async useFreeze(@SessionId() sessionId: string): Promise<StreakStatusDto> {
    return this.streakService.useFreeze(sessionId);
  }

  @Get('quiz/next')
  @UseGuards(TrustedUserGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get the next unanswered quiz question' })
  @ApiResponse({ status: 200, type: QuizNextResponseDto })
  async getNextQuestion(
    @SessionId() sessionId: string,
  ): Promise<QuizNextResponseDto> {
    return this.quizService.getNextQuestion(sessionId);
  }

  @Post('quiz/answer')
  @UseGuards(TrustedUserGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Submit a quiz answer to earn a streak freeze' })
  @ApiResponse({ status: 200, type: QuizResultDto })
  async submitAnswer(
    @SessionId() sessionId: string,
    @Body() dto: SubmitQuizAnswerDto,
  ): Promise<QuizResultDto> {
    return this.quizService.submitAnswer(
      sessionId,
      dto.questionId,
      dto.answerIndex,
    );
  }
}
