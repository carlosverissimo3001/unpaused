import { Controller, Get, Post, Body, Param, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from "@nestjs/swagger";
import { Request } from "express";
import { GameService } from "./game.service";
import {
  StartGameDto,
  GuessDto,
  GameStateDto,
  GuessResultDto,
  DailyStateDto,
} from "./dto/game.dto";

const SESSION_COOKIE_NAME = "unpaused_session";

@ApiTags("Game")
@Controller("game")
export class GameController {
  constructor(private gameService: GameService) {}

  @Post("start")
  @ApiOperation({ summary: "Start a new game from a playlist" })
  @ApiCookieAuth()
  @ApiResponse({ status: 201, type: GameStateDto })
  async startGame(
    @Req() req: Request,
    @Body() dto: StartGameDto
  ): Promise<GameStateDto> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME] || null;
    return this.gameService.startGame(sessionId, dto.playlistId);
  }

  // Daily routes MUST come before parameterized routes
  @Get("daily/today")
  @ApiOperation({ summary: "Get today's daily puzzle (trusted users only)" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: DailyStateDto })
  @ApiResponse({ status: 403, description: "Not a trusted user" })
  async getDailyPuzzle(@Req() req: Request): Promise<DailyStateDto> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new Error("Not authenticated");
    }
    return this.gameService.getDailyPuzzle(sessionId);
  }

  @Post("daily/guess")
  @ApiOperation({ summary: "Submit a guess for daily puzzle" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GuessResultDto })
  async submitDailyGuess(
    @Req() req: Request,
    @Body() dto: GuessDto
  ): Promise<GuessResultDto> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new Error("Not authenticated");
    }
    return this.gameService.submitDailyGuess(
      sessionId,
      dto.trackId || null,
      dto.skip || false
    );
  }

  // Parameterized routes come AFTER specific routes
  @Get(":sessionId")
  @ApiOperation({ summary: "Get game state" })
  @ApiParam({ name: "sessionId", description: "Game session ID" })
  @ApiResponse({ status: 200, type: GameStateDto })
  async getGameState(
    @Param("sessionId") sessionId: string
  ): Promise<GameStateDto> {
    return this.gameService.getGameState(sessionId);
  }

  @Post(":sessionId/guess")
  @ApiOperation({ summary: "Submit a guess" })
  @ApiParam({ name: "sessionId", description: "Game session ID" })
  @ApiResponse({ status: 200, type: GuessResultDto })
  async submitGuess(
    @Param("sessionId") sessionId: string,
    @Body() dto: GuessDto
  ): Promise<GuessResultDto> {
    return this.gameService.submitGuess(
      sessionId,
      dto.trackId || null,
      dto.skip || false
    );
  }
}
