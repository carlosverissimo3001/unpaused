import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SpotifyService } from "./spotify.service";
import { SessionService } from "./session.service";
import { v4 as uuidv4 } from "uuid";
import { LoginStartResult } from "../types";
import { UserRepository } from "../repositories/user.repository";
import { addDays } from "date-fns";
import { AuthMeResponseDto } from "../dto/auth.dto";
import { MS_IN_SECOND } from "../consts";
import { UserSessionDto } from "../dto/user-session.dto";

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private userRepository: UserRepository
  ) {}

  /**
   * Start OAuth flow: generate PKCE, store state, return auth URL
   */
  async startLogin(): Promise<LoginStartResult> {
    const state = uuidv4();
    const codeVerifier = this.spotifyService.generateCodeVerifier();
    const codeChallenge = this.spotifyService.generateCodeChallenge(codeVerifier);

    await this.sessionService.storePkceState(state, codeVerifier);

    const authUrl = this.spotifyService.buildAuthUrl(state, codeChallenge);

    return { authUrl, state };
  }

  /**
   * Handle OAuth callback: exchange code, fetch profile, create session
   */
  async handleCallback(code: string, state: string): Promise<string> {
    // Retrieve and validate PKCE state
    const pkceState = await this.sessionService.consumePkceState(state);
    if (!pkceState) {
      throw new UnauthorizedException("Invalid or expired OAuth state");
    }

    const tokens = await this.spotifyService.exchangeCodeForTokens(code, pkceState.codeVerifier);

    const profile = await this.spotifyService.getUserProfile(tokens.accessToken);
    const displayName = profile.display_name || profile.id;

    const user = await this.prismaService.user.upsert({
      where: { spotifyUserId: profile.id },
      create: {
        spotifyUserId: profile.id,
        displayName,
      },
      update: {
        displayName,
      },
    });

    const sessionId = await this.sessionService.createSession(
      user.spotifyUserId,
      user.displayName,
      user.isTrusted,
      tokens
    );

    return sessionId;
  }

  /**
   * Get current user info from session
   * @param sessionId - The session ID
   * @returns The current user info
   */
  async getCurrentUser(sessionId: string): Promise<AuthMeResponseDto> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException("Session expired");
    }

    return {
      spotifyUserId: session.spotifyUserId,
      displayName: session.displayName,
      isTrusted: session.isTrusted,
    };
  }

  /**
   * Get session with valid access token (refresh if needed)
   * @param sessionId - The session ID
   * @returns The session
   */
  async getSessionWithValidToken(sessionId: string): Promise<UserSessionDto> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException("Session not found");
    }

    // Check if token is expired or about to expire (5 min buffer)
    const bufferMs = 5 * 60 * MS_IN_SECOND;
    if (session.tokens.expiresAt - Date.now() < bufferMs) {
      try {
        const newTokens = await this.spotifyService.refreshAccessToken(session.tokens.refreshToken);
        session.tokens = newTokens;
        await this.sessionService.updateSession(session);
      } catch {
        // Refresh failed, session is invalid
        await this.sessionService.deleteSession(sessionId);
        throw new UnauthorizedException("Session invalid");
      }
    }

    return session;
  }

  /**
   * Logout: delete session
   * @param sessionId - The session ID
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.deleteSession(sessionId);
  }

  /**
   * Dev-only: create a mock session without Spotify OAuth
   * @returns The session ID
   */
  async createDevSession(): Promise<string> {
    const mockSpotifyId = "dev_user_123";
    const mockDisplayName = "Dev User";

    const user = await this.userRepository.upsert({
      spotifyUserId: mockSpotifyId,
      displayName: mockDisplayName,
      isTrusted: true,
    });

    // Mock tokens, doesn't work for real Spotify API calls of course :)
    const mockTokens = {
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
      expiresAt: addDays(new Date(), 1).getTime(),
    };

    const sessionId = await this.sessionService.createSession(
      user.spotifyUserId,
      user.displayName,
      user.isTrusted,
      mockTokens
    );

    return sessionId;
  }
}
