import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { SessionGuard } from '../../utils/guards/session-guard';
import { UserPreferenceDto } from '../dto/user-preference.dto';
import { UpdateUserPreferenceDto } from '../dto/update-user-preference.dto';
import { UserPreferencesService } from '../services/user-preferences.service';

@ApiTags('Api')
@Controller('user-preferences')
@UseGuards(SessionGuard)
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: UserPreferenceDto })
  async get(@SessionId() sessionId: string): Promise<UserPreferenceDto> {
    return this.userPreferencesService.getBySessionId(sessionId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: UserPreferenceDto })
  async update(
    @SessionId() sessionId: string,
    @Body() dto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceDto> {
    return this.userPreferencesService.update(sessionId, dto);
  }
}
