import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { SessionGuard } from '@utils/guards/session-guard';
import { SessionThrottlerGuard } from '@throttle/guards/session-throttler.guard';
import {
  THROTTLE_SEARCH,
  THROTTLE_SEARCH_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';

@ApiTags('Api')
@Controller('search')
@UseGuards(SessionGuard)
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('tracks')
  @UseGuards(SessionThrottlerGuard)
  @Throttle({
    [THROTTLE_SEARCH]: { limit: THROTTLE_SEARCH_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiOperation({ summary: 'Search tracks (for game guess options)' })
  @ApiResponse({
    status: 200,
    description: 'Track options',
    type: [TrackOptionDto],
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async searchTracks(@Query('q') q: string): Promise<TrackOptionDto[]> {
    return this.searchService.searchTracks(q ?? '');
  }
}
