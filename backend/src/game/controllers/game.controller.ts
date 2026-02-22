import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { PlayedTodayDto } from '../dto/daily/played-today.dto';
import { ShareResultDto } from '../dto/daily/share-result.dto';
import { GameHistoryDto } from '../dto/game-history.dto';
import { GameStateDto } from '../dto/game-state.dto';
import { StartGameDto } from '../dto/game/start-game.dto';
import { GetHistoryDto } from '../dto/get-history.dto';
import { GuessResultDto } from '../dto/guess/guess-result.dto';
import { GuessDto } from '../dto/guess/guess.dto';
import { GameStatsDto } from '../dto/stats/game-stats.dto';
import { GetStatsDto } from '../dto/stats/get-stats.dto';
import { GameService } from '../services/game.service';

@ApiTags('Api')
@Controller('game')
@UseGuards(SessionGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new game from a playlist or daily' })
  @ApiCookieAuth()
  @ApiResponse({ status: 201, type: GameStateDto })
  async startGame(
    @SessionId() sessionId: string,
    @Body() params: StartGameDto,
  ): Promise<GameStateDto> {
    return this.gameService.startGame(sessionId, params);
  }

  @Get('history')
  @ApiOperation({ summary: "Get user's game session history (paginated)" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GameHistoryDto })
  async getHistory(
    @SessionId() sessionId: string,
    @Query() dto: GetHistoryDto,
  ): Promise<GameHistoryDto> {
    return this.gameService.getHistory(sessionId, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: "Get user's daily stats" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GameStatsDto })
  async getStats(
    @SessionId() sessionId: string,
    @Query() params: GetStatsDto,
  ): Promise<GameStatsDto> {
    return this.gameService.getStats(sessionId, params);
  }

  @Get('daily/played-today')
  @ApiOperation({ summary: "Whether the user has played today's daily" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: PlayedTodayDto })
  async getPlayedToday(
    @SessionId() sessionId: string,
  ): Promise<PlayedTodayDto> {
    return this.gameService.getPlayedToday(sessionId);
  }

  @Get('share/:id')
  @ApiOperation({ summary: 'Get shareable result for a game session' })
  @ApiParam({ name: 'id', description: 'Game session ID' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: ShareResultDto })
  async getShare(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<ShareResultDto> {
    return this.gameService.getShare(sessionId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get current game state' })
  @ApiCookieAuth()
  @ApiParam({ name: 'id', description: 'The internal Game Session UUID' })
  @ApiResponse({ status: 200, type: GameStateDto })
  async getGameState(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<GameStateDto> {
    return this.gameService.getGameState(sessionId, id);
  }

  @Post(':id/guess')
  @UseGuards(SessionThrottlerGuard)
  @Throttle({
    [THROTTLE_GUESS]: { limit: THROTTLE_GUESS_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiOperation({ summary: 'Submit a guess for a specific session' })
  @ApiParam({ name: 'id', description: 'The internal Game Session UUID' })
  @ApiResponse({ status: 200, type: GuessResultDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async submitGuess(
    @SessionId() sessionId: string,
    @Param('id') id: string,
    @Body() dto: GuessDto,
  ): Promise<GuessResultDto> {
    return this.gameService.submitGuess(sessionId, id, dto);
  }
}
