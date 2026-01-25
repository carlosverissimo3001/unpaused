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
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../consts";
import { AuthMeResponseDto } from "../dto/auth.dto";
import { AuthService } from "../services/auth.service";
import { TokenLoginDto } from "../dto/token-login.dto";

@ApiTags("Api")
@Controller("auth")
export class AuthController {
  private readonly frontendUrl: string;
  private readonly sessionMaxAge: number;

  constructor(private authService: AuthService, private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";
    this.sessionMaxAge = this.configService.get<number>("SESSION_MAX_AGE_SECONDS") || 604800;
  }

  @Get("login")
  @ApiOperation({ summary: "Start Spotify OAuth flow" })
  @ApiResponse({
    status: 302,
    description: "Redirects to Spotify authorization",
  })
  async login(@Res() res: Response) {
    const { authUrl } = await this.authService.startLogin();
    res.redirect(authUrl);
  }

  @Get("callback")
  @ApiOperation({ summary: "Handle Spotify OAuth callback" })
  @ApiResponse({ status: 302, description: "Redirects to frontend after auth" })
  async callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
    @Res() res: Response
  ) {
    if (error) {
      return res.redirect(`${this.frontendUrl}?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${this.frontendUrl}?error=missing_params`);
    }

    try {
      const sessionId = await this.authService.handleCallback(code, state);

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: this.sessionMaxAge * 1000,
        path: "/",
      });

      res.redirect(this.frontendUrl);
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect(`${this.frontendUrl}?error=auth_failed`);
    }
  }

  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: AuthMeResponseDto })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async me(@Req() req: Request): Promise<AuthMeResponseDto> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new UnauthorizedException("Not authenticated");
    }

    const user = await this.authService.getCurrentUser(sessionId);
    if (!user) {
      throw new UnauthorizedException("Session expired");
    }

    return user;
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Logout and clear session" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: "Successfully logged out" })
  async logout(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({ success: true });
  }

  @Post("token-login")
  @ApiOperation({
    summary: "Dev-only: Login with a manually obtained Spotify token",
    description:
      "Use this when you have a Spotify access token but can't use OAuth flow. " +
      "The token is validated by fetching your Spotify profile.",
  })
  @ApiBody({ type: TokenLoginDto })
  @ApiResponse({ status: 200, description: "Successfully logged in" })
  @ApiResponse({ status: 401, description: "Invalid token" })
  @ApiResponse({ status: 403, description: "Not available in production" })
  async tokenLogin(@Body() body: TokenLoginDto, @Res() res: Response) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Token login not available in production");
    }

    try {
      const sessionId = await this.authService.createSessionFromToken(
        body.accessToken,
        body.refreshToken
      );

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: this.sessionMaxAge * 1000,
        path: "/",
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Token login error:", err);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
