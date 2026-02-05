import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SessionGuard } from '@utils/guards/session-guard';

@ApiTags('Api')
@Controller('search')
@UseGuards(SessionGuard)
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('tracks')
  @ApiOperation({ summary: 'Search Spotify tracks (for game guess options)' })
  @ApiResponse({
    status: 200,
    description: 'Track options',
    type: [TrackOptionDto],
  })
  async searchTracks(
    @SessionId() sessionId: string,
    @Query('q') q: string,
  ): Promise<TrackOptionDto[]> {
    return this.searchService.searchTracks(sessionId, q ?? '');
  }
}
