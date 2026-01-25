import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from "@nestjs/swagger";
import { GameService } from "./game.service";
import {
  StartGameDto,
  GuessDto,
  GameStateDto,
  GuessResultDto,
} from "./dto/game.dto";
import { SessionId } from "@utils/decorators/sessionId.decorator";
import { SessionGuard } from "@utils/guards/session-guard";

@ApiTags("Api")
@Controller("game")
@UseGuards(SessionGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post("start")
  @ApiOperation({ summary: "Start a new game from a playlist" })
  @ApiCookieAuth()
  @ApiResponse({ status: 201, type: GameStateDto })
  async startGame(
    @SessionId() sessionId: string,
    @Body() dto: StartGameDto
  ): Promise<GameStateDto> {
    return this.gameService.startGame(sessionId, dto.playlistId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get current game state" })
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
