import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  THROTTLE_GUEST,
  THROTTLE_GUEST_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { GuestSessionGuard } from '../guards/guest-session.guard';
import { GuestSearchService } from '../services/guest-search.service';

@ApiTags('Api')
@Controller('guest/search')
@UseGuards(GuestSessionGuard, ThrottlerGuard)
@Throttle({
  [THROTTLE_GUEST]: { limit: THROTTLE_GUEST_LIMIT, ttl: THROTTLE_TTL },
})
export class GuestSearchController {
  constructor(private readonly guestSearchService: GuestSearchService) {}

  @Get('tracks')
  @ApiOperation({ summary: 'Search Spotify tracks (guest guess options)' })
  @ApiResponse({ status: 200, type: [TrackOptionDto] })
  async searchTracks(@Query('q') q: string): Promise<TrackOptionDto[]> {
    return this.guestSearchService.searchTracks(q ?? '');
  }
}
