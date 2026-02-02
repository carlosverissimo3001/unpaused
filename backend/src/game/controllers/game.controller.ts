import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { GameService } from "../services/game.service";
import { GameStateDto } from "../dto/game-state.dto";
import { StartGameDto } from "../dto/start-game.dto";
import { GuessDto } from "../dto/guess.dto";
import { GuessResultDto } from "../dto/guess-result.dto";
import { GameHistoryDto } from "../dto/game-history.dto";
import { GetHistoryDto } from "../dto/get-history.dto";
import { ShareResultDto } from "../dto/share-result.dto";
import { DailyStatsDto } from "../dto/daily-stats.dto";
import { SessionId } from "@utils/decorators/sessionId.decorator";
import { SessionGuard } from "@utils/guards/session-guard";

@ApiTags("Api")
@Controller("game")
@UseGuards(SessionGuard)
export class GameController {
  constructor(private readonly gameService: GameService) { }

  @Post("start")
  @ApiOperation({ summary: "Start a new game from a playlist or daily" })
  @ApiCookieAuth()
  @ApiResponse({ status: 201, type: GameStateDto })
  async startGame(
    @SessionId() sessionId: string,
    @Body() params: StartGameDto
  ): Promise<GameStateDto> {
    return this.gameService.startGame(sessionId, params);
  }

  @Get("history")
  @ApiOperation({ summary: "Get user's game session history (paginated)" })
  @ApiCookieAuth()
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiQuery({ name: "isDaily", required: false, type: Boolean })
  @ApiQuery({ name: "isCompleted", required: false, type: Boolean })
  @ApiResponse({ status: 200, type: GameHistoryDto })
  async getHistory(
    @SessionId() sessionId: string,
    @Query() dto: GetHistoryDto
  ): Promise<GameHistoryDto> {
    return this.gameService.getHistory(sessionId, dto);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get user's daily stats" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: DailyStatsDto })
  async getStats(@SessionId() sessionId: string): Promise<DailyStatsDto> {
    return this.gameService.getStats(sessionId);
  }

  @Get("share/:id")
  @ApiOperation({ summary: "Get shareable result for a game session" })
  @ApiParam({ name: "id", description: "Game session ID" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: ShareResultDto })
  async getShare(
    @SessionId() sessionId: string,
    @Param("id") id: string
  ): Promise<ShareResultDto> {
    return this.gameService.getShare(sessionId, id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get current game state" })
  @ApiCookieAuth()
  @ApiParam({ name: "id", description: "The internal Game Session UUID" })
  @ApiResponse({ status: 200, type: GameStateDto })
  async getGameState(@Param("id") id: string): Promise<GameStateDto> {
    return this.gameService.getGameState(id);
  }

  @Post(":id/guess")
  @ApiOperation({ summary: "Submit a guess for a specific session" })
  @ApiParam({ name: "id", description: "The internal Game Session UUID" })
  @ApiResponse({ status: 200, type: GuessResultDto })
  async submitGuess(
    @Param("id") id: string,
    @Body() dto: GuessDto
  ): Promise<GuessResultDto> {
    return this.gameService.submitGuess(id, dto);
  }
}
