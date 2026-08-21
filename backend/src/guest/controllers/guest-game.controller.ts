import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  THROTTLE_GUEST,
  THROTTLE_GUEST_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';
import { GameStateDto } from '../../game/dto/game-state.dto';
import { GuessDto } from '../../game/dto/guess/guess.dto';
import { GuessResultDto } from '../../game/dto/guess/guess-result.dto';
import { GuestSessionGuard } from '../guards/guest-session.guard';
import { GuestId } from '../decorators/guestId.decorator';
import { GuestGameService } from '../services/guest-game.service';

/**
 * Public, unauthenticated play for visitors without a Spotify login. No
 * cookie-based user session exists here - GuestSessionGuard provisions an
 * anonymous identity on first contact instead. Rate limited by IP, same as
 * the /demo endpoints, since there's no session to key on.
 */
@ApiTags('Api')
@Controller('guest/games')
@UseGuards(GuestSessionGuard, ThrottlerGuard)
@Throttle({
  [THROTTLE_GUEST]: { limit: THROTTLE_GUEST_LIMIT, ttl: THROTTLE_TTL },
})
export class GuestGameController {
  constructor(private readonly guestGameService: GuestGameService) {}

  @Post()
  @ApiOperation({ summary: 'Start a guest game from the curated pool' })
  @ApiResponse({ status: 201, type: GameStateDto })
  async startGame(@GuestId() guestId: string): Promise<GameStateDto> {
    return this.guestGameService.startGame(guestId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get current guest game state' })
  @ApiParam({ name: 'id', description: 'The guest round id' })
  @ApiResponse({ status: 200, type: GameStateDto })
  async getGameState(
    @GuestId() guestId: string,
    @Param('id') id: string,
  ): Promise<GameStateDto> {
    return this.guestGameService.getGameState(guestId, id);
  }

  @Post(':id/guess')
  @ApiOperation({ summary: 'Submit a guess for a guest round' })
  @ApiParam({ name: 'id', description: 'The guest round id' })
  @ApiResponse({ status: 200, type: GuessResultDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async submitGuess(
    @GuestId() guestId: string,
    @Param('id') id: string,
    @Body() dto: GuessDto,
  ): Promise<GuessResultDto> {
    return this.guestGameService.submitGuess(guestId, id, dto);
  }
}
