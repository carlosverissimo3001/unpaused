import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MessageService } from '../../message/services/message.service';
import { MessageDto } from '../../message/dto/message.dto';
import { CreateMessageDto } from '../../message/dto/create-message.dto';
import { UpdateMessageDto } from '../../message/dto/update-message.dto';
import { StreakQuizService } from '../../streak/streak-quiz.service';
import { StreakQuestionDto } from '../../streak/dto/streak-question.dto';
import { CreateStreakQuestionDto } from '../../streak/dto/create-streak-question.dto';
import { UpdateStreakQuestionDto } from '../../streak/dto/update-streak-question.dto';
import { SessionGuard } from '@utils/guards/session-guard';
import { AdminGuard } from '@utils/guards/admin-guard';
import { SessionId } from '@utils/decorators/sessionId.decorator';

@ApiTags('Api')
@Controller('admin')
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly messageService: MessageService,
    private readonly streakQuizService: StreakQuizService,
  ) {}

  @Get('messages')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get all messages (admin only)' })
  @ApiResponse({ status: 200, type: [MessageDto] })
  async getAllMessages(): Promise<MessageDto[]> {
    return this.messageService.findAll();
  }

  @Post('messages')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new message (admin only)' })
  @ApiResponse({ status: 201, type: MessageDto })
  async createMessage(@Body() dto: CreateMessageDto): Promise<MessageDto> {
    return this.messageService.create(dto);
  }

  @Patch('messages/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a message (admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MessageDto })
  async updateMessage(
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageDto> {
    return this.messageService.update(id, dto);
  }

  @Delete('messages/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a message (admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204 })
  async deleteMessage(@Param('id') id: string): Promise<void> {
    return this.messageService.delete(id);
  }

  @Get('streak-questions')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List all streak quiz questions (admin only)' })
  @ApiResponse({ status: 200, type: [StreakQuestionDto] })
  async listStreakQuestions(): Promise<StreakQuestionDto[]> {
    return this.streakQuizService.listAllQuestions();
  }

  @Post('streak-questions')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a streak quiz question (admin only)' })
  @ApiResponse({ status: 201, type: StreakQuestionDto })
  async createStreakQuestion(
    @SessionId() sessionId: string,
    @Body() dto: CreateStreakQuestionDto,
  ): Promise<StreakQuestionDto> {
    return this.streakQuizService.createQuestion(sessionId, dto);
  }

  @Patch('streak-questions/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a streak quiz question (admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: StreakQuestionDto })
  async updateStreakQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateStreakQuestionDto,
  ): Promise<StreakQuestionDto> {
    return this.streakQuizService.updateQuestion(id, dto);
  }

  @Delete('streak-questions/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Soft-delete a streak quiz question (admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204 })
  async deleteStreakQuestion(@Param('id') id: string): Promise<void> {
    return this.streakQuizService.deleteQuestion(id);
  }
}
