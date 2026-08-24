import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DEVICE_COOKIE_NAME, SESSION_COOKIE_NAME } from '../../consts';
import { AuthMeResponseDto } from '../dto/auth.dto';
import { PatchUserDto } from '../dto/patch-user.dto';
import { AuthService } from '../services/auth.service';
import { AppLoggerService } from '../../logger/logger.service';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { SpotifyOAuthCallbackDto } from '../dto/spotify/spotify-oauth-callback.dto';
import {
  buildErrorRedirect,
  getClearCookieOptions,
  getCookieOptions,
} from '../utils/http-helpers';

@ApiTags('Api')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly sessionMaxAge: number;

  private readonly logger: AppLoggerService;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(AuthController.name);
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.sessionMaxAge =
      this.configService.get<number>('SESSION_MAX_AGE_SECONDS') || 604800;
  }

  @Get('login')
  @ApiOperation({ summary: 'Start Spotify OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Spotify authorization',
  })
  async login(@Res() res: Response) {
    const { authUrl } = await this.authService.startLogin();
    res.redirect(authUrl);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Spotify OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after auth' })
  async callback(
    @Query() params: SpotifyOAuthCallbackDto,
    @Res() res: Response,
  ) {
    const { code, state, error } = params;

    if (error) {
      return res.redirect(buildErrorRedirect(this.frontendUrl, error));
    }

    try {
      const sessionId = await this.authService.handleCallback(code, state);
      res.cookie(
        SESSION_COOKIE_NAME,
        sessionId,
        getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
      );
      res.redirect(this.frontendUrl);
    } catch (err) {
      this.logger.error('OAuth callback error:', err);
      res.redirect(buildErrorRedirect(this.frontendUrl, 'auth_failed'));
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: AuthMeResponseDto })
  async me(@SessionId() sessionId: string): Promise<AuthMeResponseDto> {
    const user = await this.authService.getCurrentUser(sessionId);
    if (!user) {
      throw new UnauthorizedException('Session expired');
    }

    return user;
  }

  @Patch('me')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: AuthMeResponseDto })
  async updateMe(
    @SessionId() sessionId: string,
    @Body() dto: PatchUserDto,
  ): Promise<AuthMeResponseDto> {
    return this.authService.updateProfile(sessionId, dto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout and clear session' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    // Logging out means forgetting this browser, device token included.
    const deviceToken = req.cookies?.[DEVICE_COOKIE_NAME] as string | undefined;
    if (deviceToken) {
      await this.authService.forgetDevice(deviceToken);
    }

    res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
    res.clearCookie(DEVICE_COOKIE_NAME, getClearCookieOptions());

    res.json({ success: true });
  }
}
