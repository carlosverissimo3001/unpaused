import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionId } from '@utils/decorators/sessionId.decorator';
import { SessionGuard } from '@utils/guards/session-guard';
import { GauntletService } from '../services/gauntlet.service';
import { StartRunDto } from '../dto/start-run.dto';
import { SubmitGauntletGuessDto } from '../dto/submit-gauntlet-guess.dto';
import { GauntletRunStateDto } from '../dto/gauntlet-run-state.dto';
import { GauntletGuessResultDto } from '../dto/gauntlet-guess-result.dto';
import { PersonalBestDto } from '../dto/personal-best.dto';

@ApiTags('Gauntlet')
@Controller('gauntlet')
@UseGuards(SessionGuard)
export class GauntletController {
  constructor(private readonly gauntletService: GauntletService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new gauntlet run' })
  @ApiCookieAuth()
  @ApiResponse({ status: 201, type: GauntletRunStateDto })
  async startRun(
    @SessionId() sessionId: string,
    @Body() dto: StartRunDto,
  ): Promise<GauntletRunStateDto> {
    return this.gauntletService.startRun(
      sessionId,
      dto.playlistId,
      dto.difficulty,
    );
  }

  @Post(':id/guess')
  @ApiOperation({ summary: 'Submit a guess for the current gauntlet track' })
  @ApiParam({ name: 'id', description: 'The gauntlet run ID' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletGuessResultDto })
  async submitGuess(
    @SessionId() sessionId: string,
    @Param('id') id: string,
    @Body() dto: SubmitGauntletGuessDto,
  ): Promise<GauntletGuessResultDto> {
    return this.gauntletService.submitGuess(sessionId, id, dto, dto.playlistId);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'Voluntarily end a gauntlet run (quit)' })
  @ApiParam({ name: 'id', description: 'The gauntlet run ID' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: GauntletRunStateDto })
  async endRun(
    @SessionId() sessionId: string,
    @Param('id') id: string,
  ): Promise<GauntletRunStateDto> {
    return this.gauntletService.endRun(sessionId, id);
  }

  @Get('personal-best')
  @ApiOperation({ summary: "Get user's gauntlet personal best" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: PersonalBestDto })
  async getPersonalBest(
    @SessionId() sessionId: string,
  ): Promise<PersonalBestDto> {
    return this.gauntletService.getPersonalBest(sessionId);
  }
}
