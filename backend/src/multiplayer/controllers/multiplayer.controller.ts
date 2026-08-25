import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SessionGuard } from '@utils/guards/session-guard';
import { SessionThrottlerGuard } from '@throttle/guards/session-throttler.guard';
import {
  THROTTLE_GUESS,
  THROTTLE_GUESS_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';
import { GuessDto } from '../../game/dto/guess/guess.dto';
import { GuessResultDto } from '../../game/dto/guess/guess-result.dto';
import { RoomService } from '../services/room.service';
import { MultiplayerGameService } from '../services/multiplayer-game.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { RoomDto } from '../dto/room.dto';
import { MultiplayerRoundStateDto } from '../dto/multiplayer-round-state.dto';
import { ScoreboardDto } from '../dto/scoreboard.dto';

@ApiTags('Api')
@Controller('multiplayer')
@UseGuards(SessionGuard)
export class MultiplayerController {
  constructor(
    private readonly roomService: RoomService,
    private readonly gameService: MultiplayerGameService,
  ) {}

  @Post('rooms')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new multiplayer room' })
  @ApiResponse({ status: 201, type: RoomDto })
  async createRoom(
    @SessionId() sessionId: string,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomDto> {
    return this.roomService.createRoom(sessionId, dto);
  }

  @Get('rooms/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get room state with players' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, type: RoomDto })
  async getRoomState(@Param('id') id: string): Promise<RoomDto> {
    return this.roomService.getRoomState(id);
  }

  @Post('rooms/:code/join')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Join a room by invite code' })
  @ApiParam({ name: 'code', description: 'Room invite code' })
  @ApiResponse({ status: 200, type: RoomDto })
  async joinRoom(
    @SessionId() sessionId: string,
    @Param('code') code: string,
  ): Promise<RoomDto> {
    return this.roomService.joinRoom(sessionId, code);
  }

  @Post('rooms/:id/ready')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Toggle ready status for current player' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, type: RoomDto })
  async toggleReady(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<RoomDto> {
    return this.roomService.toggleReady(sessionId, id);
  }

  @Post('rooms/:id/start')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Start the game (host only)' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, type: RoomDto })
  async startGame(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<RoomDto> {
    return this.roomService.startGame(sessionId, id);
  }

  @Post('rooms/:id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Leave a room (host leaving expires it)' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 204 })
  async leaveRoom(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.roomService.leaveRoom(sessionId, id);
  }

  @Get('rooms/:id/round')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current round state for the player' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, type: MultiplayerRoundStateDto })
  async getRoundState(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<MultiplayerRoundStateDto> {
    return this.gameService.getRoundState(sessionId, id);
  }

  @Post('rooms/:id/guess')
  @UseGuards(SessionThrottlerGuard)
  @Throttle({
    [THROTTLE_GUESS]: { limit: THROTTLE_GUESS_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Submit a guess for the current round' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, type: GuessResultDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async submitGuess(
    @SessionId() sessionId: string,
    @Param('id') id: string,
    @Body() dto: GuessDto,
  ): Promise<GuessResultDto> {
    return this.gameService.submitGuess(sessionId, id, dto);
  }

  @Get('rooms/:id/scoreboard')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get scoreboard (only completed rounds visible)' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, type: ScoreboardDto })
  async getScoreboard(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<ScoreboardDto> {
    return this.gameService.getScoreboard(sessionId, id);
  }
}
