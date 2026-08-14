import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { DemoService } from '../services/demo.service';
import {
  THROTTLE_DEMO,
  THROTTLE_DEMO_LIMIT,
  THROTTLE_TTL,
} from '../../throttle/throttle.constants';
import {
  DemoGuessResultDto,
  DemoPlaylistDto,
  DemoRoundDto,
  GuessDemoDto,
  StartDemoRoundDto,
} from '../dto/demo-round.dto';

/**
 * Public and unauthenticated, unlike every other controller here: it exists so
 * carlosverissimo.com can run a real round without a Spotify login. It shares
 * no state with the real game and reads only the curated chart pool.
 *
 * Rate limited by IP via the stock ThrottlerGuard rather than the app's
 * session-based one, since there is no session to key on.
 */
@ApiTags('demo')
@Controller('demo')
@UseGuards(ThrottlerGuard)
@Throttle({
  [THROTTLE_DEMO]: { limit: THROTTLE_DEMO_LIMIT, ttl: THROTTLE_TTL },
})
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get('playlists')
  @ApiOperation({ summary: 'Playlists a demo round can be started from' })
  @ApiResponse({ status: 200, type: [DemoPlaylistDto] })
  getPlaylists(): DemoPlaylistDto[] {
    return this.demoService
      .getPlaylists()
      .map(({ slug, name }) => ({ slug, name }));
  }

  @Post('rounds')
  @ApiOperation({ summary: 'Start a round; the answer stays server-side' })
  @ApiResponse({ status: 201, type: DemoRoundDto })
  @ApiResponse({ status: 503, description: 'Track pool not populated yet' })
  startRound(@Body() dto: StartDemoRoundDto): Promise<DemoRoundDto> {
    return this.demoService.createRound(dto.playlistSlug);
  }

  @Post('rounds/:roundId/guesses')
  @ApiOperation({ summary: 'Score a guess; reveals the answer when resolved' })
  @ApiResponse({ status: 201, type: DemoGuessResultDto })
  @ApiResponse({ status: 404, description: 'Round not found or expired' })
  guess(
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Body() dto: GuessDemoDto,
  ): Promise<DemoGuessResultDto> {
    return this.demoService.guess(roundId, dto.trackId);
  }
}
