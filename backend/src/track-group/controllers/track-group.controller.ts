import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackGroupType } from '@prisma/client';
import { TrackGroupService } from '../services/track-group.service';
import { TrackGroupDto } from '../dto/track-group.dto';
import { ListTrackGroupsDto } from '../dto/list-track-groups.dto';
import { AuthService } from '../../auth/services/auth.service';
import { SESSION_COOKIE_NAME } from '../../consts';

@ApiTags('Api')
@Controller('track-groups')
export class TrackGroupController {
  constructor(
    private readonly trackGroupService: TrackGroupService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Curated sets of songs anyone can play, library or not',
  })
  @ApiResponse({ status: 200, type: [TrackGroupDto] })
  async list(
    @Query() query: ListTrackGroupsDto,
    @Req() req: Request,
  ): Promise<TrackGroupDto[]> {
    const type = query.type ?? TrackGroupType.DECADE;

    if (!TrackGroupService.isVisible(type, await this.currentUser(req))) {
      // Empty rather than forbidden: whether a group exists is itself the
      // thing being kept back.
      return [];
    }

    return this.trackGroupService.list(type);
  }

  /** Null for a visitor with no session, rather than refusing the request. */
  private async currentUser(req: Request) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!sessionId) {
      return null;
    }
    try {
      return await this.authService.getUserBySessionId(sessionId);
    } catch {
      return null;
    }
  }
}
