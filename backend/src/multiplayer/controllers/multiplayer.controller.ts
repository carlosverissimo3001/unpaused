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
import { SetTrackSourceDto } from '../dto/set-track-source.dto';
import { KickPlayerDto } from '../dto/kick-player.dto';
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
  @ApiResponse({ status: 200, type: RoomDto })
  @ApiResponse({ status: 403, description: 'You are not in this room' })
  async getRoomState(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<RoomDto> {
    return this.roomService.getRoomState(sessionId, id);
  }

  @Post('rooms/:code/join')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Join a room by invite code' })
  @ApiResponse({ status: 200, type: RoomDto })
  async joinRoom(
    @SessionId() sessionId: string,
    @Param('code') code: string,
  ): Promise<RoomDto> {
    return this.roomService.joinRoom(sessionId, code);
  }

  @Post('rooms/:id/track-source')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Choose where the room draws its songs from' })
  @ApiResponse({ status: 200, type: RoomDto })
  async setTrackSource(
    @SessionId() sessionId: string,
    @Param('id') id: string,
    @Body() dto: SetTrackSourceDto,
  ): Promise<RoomDto> {
    return this.roomService.setTrackSource(sessionId, id, dto.trackSource);
  }

  @Post('rooms/:id/kick')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove a player from the room (host only)' })
  @ApiResponse({ status: 200, type: RoomDto })
  @ApiResponse({ status: 403, description: 'Only the host can remove players' })
  async kickPlayer(
    @SessionId() sessionId: string,
    @Param('id') id: string,
    @Body() dto: KickPlayerDto,
  ): Promise<RoomDto> {
    return this.roomService.kickPlayer(sessionId, id, dto.userId);
  }

  @Post('rooms/:id/ready')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Toggle ready status for current player' })
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
  @ApiResponse({ status: 200, type: ScoreboardDto })
  async getScoreboard(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<ScoreboardDto> {
    return this.gameService.getScoreboard(sessionId, id);
  }
}
