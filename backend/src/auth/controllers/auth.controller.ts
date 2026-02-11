import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from '../../consts';
import { AuthMeResponseDto } from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';
import { TokenLoginDto } from '../dto/token-login.dto';
import { AppLoggerService } from '../../logger/logger.service';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { SpotifyOAuthCallbackDto } from '../dto/spotify/spotify-oauth-callback.dto';
import { buildErrorRedirect, getCookieOptions } from '../utils/http-helpers';

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

    res.clearCookie(
      SESSION_COOKIE_NAME,
      getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
    );

    res.json({ success: true });
  }

  @Post('token-login')
  @ApiOperation({
    summary: 'Dev-only: Login with a manually obtained Spotify token',
    description:
      "Use this when you have a Spotify access token but can't use OAuth flow. " +
      'The token is validated by fetching your Spotify profile.',
  })
  @ApiBody({ type: TokenLoginDto })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  async tokenLogin(@Body() body: TokenLoginDto, @Res() res: Response) {
    if (this.configService.get<string>('ENABLE_TOKEN_LOGIN') !== 'true') {
      throw new ForbiddenException(
        'Token login not available in this environment',
      );
    }

    try {
      const sessionId = await this.authService.createSessionFromToken(
        body.accessToken,
        body.refreshToken,
      );

      const isProd =
        this.configService.get<string>('NODE_ENV') === 'production';
      const sameSite = isProd ? 'none' : 'lax';

      res.cookie(
        SESSION_COOKIE_NAME,
        sessionId,
        getCookieOptions({
          sessionMaxAge: this.sessionMaxAge,
          sameSiteOverride: sameSite,
        }),
      );

      res.json({ success: true });
    } catch (err) {
      this.logger.error('Token login error:', err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
