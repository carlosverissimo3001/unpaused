import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackGroupType } from '@prisma/client';
import { TrackGroupService } from '../services/track-group.service';
import { TrackGroupDto } from '../dto/track-group.dto';
import { ListTrackGroupsDto } from '../dto/list-track-groups.dto';

@ApiTags('Api')
@Controller('track-groups')
export class TrackGroupController {
  constructor(private readonly trackGroupService: TrackGroupService) {}

  @Get()
  @ApiOperation({
    summary: 'Curated sets of songs anyone can play, library or not',
  })
  @ApiResponse({ status: 200, type: [TrackGroupDto] })
  async list(@Query() query: ListTrackGroupsDto): Promise<TrackGroupDto[]> {
    return this.trackGroupService.list(query.type ?? TrackGroupType.DECADE);
  }
}
