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
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  DEVICE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL,
  SESSION_COOKIE_NAME,
} from '../../consts';
import { AuthMeResponseDto } from '../dto/auth.dto';
import { PatchUserDto } from '../dto/patch-user.dto';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { AppLoggerService } from '../../logger/logger.service';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { ProvisioningSessionGuard } from '../../utils/guards/provisioning-session.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import {
  THROTTLE_START,
  THROTTLE_CREDENTIALS,
  THROTTLE_CREDENTIALS_LIMIT,
  THROTTLE_START_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';
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
    const { authUrl, state } = await this.authService.startLogin();

    // The callback is a bare GET with a lax cookie, so without this a link
    // could complete someone else's sign-in in the victim's browser.
    res.cookie(
      OAUTH_STATE_COOKIE_NAME,
      state,
      getCookieOptions({ sessionMaxAge: OAUTH_STATE_TTL }),
    );

    res.redirect(authUrl);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Spotify OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after auth' })
  async callback(
    @Query() params: SpotifyOAuthCallbackDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { code, state, error } = params;

    if (error) {
      res.clearCookie(OAUTH_STATE_COOKIE_NAME, getClearCookieOptions());
      return res.redirect(buildErrorRedirect(this.frontendUrl, error));
    }

    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE_NAME] as
      | string
      | undefined;
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, getClearCookieOptions());

    if (!expectedState || expectedState !== state) {
      this.logger.warn('OAuth callback state did not match this browser');
      return res.redirect(buildErrorRedirect(this.frontendUrl, 'auth_failed'));
    }

    try {
      const currentSessionId = req.cookies?.[SESSION_COOKIE_NAME] as
        | string
        | undefined;
      const sessionId = await this.authService.handleCallback(
        code,
        state,
        currentSessionId,
      );
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

  @Post('session')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard, ProvisioningSessionGuard)
  @Throttle({
    [THROTTLE_START]: { limit: THROTTLE_START_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiOperation({
    summary: 'Ensure the caller has an identity, minting one if they have none',
  })
  @ApiResponse({ status: 200, type: AuthMeResponseDto })
  async ensureSession(
    @SessionId() sessionId: string,
  ): Promise<AuthMeResponseDto> {
    return this.authService.getCurrentUser(sessionId);
  }

  @Post('signup')
  @HttpCode(201)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [THROTTLE_CREDENTIALS]: {
      limit: THROTTLE_CREDENTIALS_LIMIT,
      ttl: THROTTLE_TTL,
    },
  })
  @ApiOperation({ summary: 'Create an account, keeping any guest progress' })
  @ApiResponse({ status: 201, type: AuthMeResponseDto })
  @ApiResponse({ status: 409, description: 'That email is already registered' })
  async signup(
    @Body() dto: SignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthMeResponseDto> {
    const currentSessionId = req.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    const sessionId = await this.authService.signup(
      dto.email,
      dto.password,
      currentSessionId,
    );
    res.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
    );
    return this.authService.getCurrentUser(sessionId);
  }

  // Not 'login': that path is the Spotify OAuth start, and the proxy gates it
  // on the site password by pathname alone, method be damned.
  @Post('signin')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [THROTTLE_CREDENTIALS]: {
      limit: THROTTLE_CREDENTIALS_LIMIT,
      ttl: THROTTLE_TTL,
    },
  })
  @ApiOperation({ summary: 'Sign in with an email and password' })
  @ApiResponse({ status: 200, type: AuthMeResponseDto })
  @ApiResponse({ status: 401, description: 'Email or password is incorrect' })
  async loginWithPassword(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthMeResponseDto> {
    const currentSessionId = req.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    const sessionId = await this.authService.login(
      dto.email,
      dto.password,
      currentSessionId,
    );
    res.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
    );
    return this.authService.getCurrentUser(sessionId);
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
