import {
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
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../consts";
import { AuthMeResponseDto } from "../dto/auth.dto";
import { AuthService } from "../services/auth.service";

@ApiTags("Auth")
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

  @Get("dev-login")
  @ApiOperation({ summary: "Dev-only: Create mock session without OAuth" })
  @ApiResponse({
    status: 302,
    description: "Redirects to frontend after mock auth",
  })
  @ApiResponse({ status: 403, description: "Not available in production" })
  async devLogin(@Res() res: Response) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Dev login not available in production");
    }

    const sessionId = await this.authService.createDevSession();

    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: this.sessionMaxAge * 1000,
      path: "/",
    });

    res.redirect(this.frontendUrl);
  }
}
