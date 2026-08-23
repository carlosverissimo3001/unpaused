import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import {
  THROTTLE_SEARCH,
  THROTTLE_SEARCH_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';

@ApiTags('Api')
// Public: results are the same for everyone now that search is Deezer-backed,
// so guests and signed-in players share one endpoint. Throttled per IP.
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('tracks')
  @UseGuards(ThrottlerGuard)
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
