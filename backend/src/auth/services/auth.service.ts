import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpotifyService } from './spotify.service';
import { SpotifyAuthService } from './spotify-auth.service';
import { SessionService } from './session.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginStartResult } from '../types';
import { UserRepository } from '../repositories/user.repository';
import { AuthMeResponseDto } from '../dto/auth.dto';
import { MS_IN_HOUR } from '../consts';
import { UserSessionDto } from '../dto/user-session.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private spotifyService: SpotifyService,
    private spotifyAuthService: SpotifyAuthService,
    private sessionService: SessionService,
    private userRepository: UserRepository,
  ) {}

  /**
   * Start OAuth flow: generate PKCE, store state, return auth URL
   */
  async startLogin(): Promise<LoginStartResult> {
    const state = uuidv4();
    const codeVerifier = this.spotifyService.generateCodeVerifier();
    const codeChallenge =
      this.spotifyService.generateCodeChallenge(codeVerifier);

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
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.spotifyService.exchangeCodeForTokens(
      code,
      pkceState.codeVerifier,
    );

    const profile = await this.spotifyService.getUserProfile(
      tokens.accessToken,
    );
    const displayName = profile.displayName || profile.id;

    const user = await this.userRepository.upsert({
      spotifyUserId: profile.id,
      displayName,
      avatarUrl: profile.avatarUrl,
    });

    // Store tokens via SpotifyAuthService (Redis cache + encrypted DB)
    await this.spotifyAuthService.storeTokens(
      user.spotifyUserId,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );

    const sessionId = await this.sessionService.createSession(
      user.spotifyUserId,
      user.displayName,
      user.isTrusted,
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
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userRepository.findBySpotifyUserId(
      session.spotifyUserId,
    );
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      spotifyUserId: session.spotifyUserId,
      displayName: session.displayName,
      isTrusted: session.isTrusted,
      isAdmin: user.isAdmin,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Resolves session to get spotifyUserId, then returns a valid access token.
   * @param sessionId - The session ID
   * @returns The session and a valid access token
   */
  async getValidAccessToken(
    sessionId: string,
  ): Promise<{ session: UserSessionDto; accessToken: string }> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const accessToken = await this.spotifyAuthService.getValidAccessToken(
      session.spotifyUserId,
    );

    return { session, accessToken };
  }

  /**
   * Get user by session ID (cookie value / Redis session key)
   * @param sessionId - The session ID from the cookie
   * @returns The user
   */
  async getUserBySessionId(sessionId: string): Promise<User> {
    const session = await this.sessionService.getSession(sessionId);
    const user = await this.prismaService.user.findUnique({
      where: { spotifyUserId: session.spotifyUserId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Get user by database user ID (users.id)
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Logout: delete session and revoke cached tokens
   * @param sessionId - The session ID
   */
  async logout(sessionId: string): Promise<void> {
    const session = await this.sessionService.getSession(sessionId);

    if (session) {
      await this.spotifyAuthService.revokeTokens(session.spotifyUserId);
    } else {
      // Session already expired — nothing to revoke
    }
    await this.sessionService.deleteSession(sessionId);
  }

  /**
   * Dev-only: create a session using a manually provided Spotify token
   * This validates the token by fetching the user profile from Spotify
   * @param accessToken - A valid Spotify access token
   * @param refreshToken - Optional refresh token (token won't auto-refresh without it)
   * @returns The session ID
   */
  async createSessionFromToken(
    accessToken: string,
    refreshToken?: string,
  ): Promise<string> {
    const profile = await this.spotifyService.getUserProfile(accessToken);

    // fyi: Move this to repo later
    const user = await this.prismaService.user.upsert({
      where: { spotifyUserId: profile.id },
      create: {
        spotifyUserId: profile.id,
        displayName: profile.displayName || profile.id,
      },
      update: {
        displayName: profile.displayName || profile.id,
      },
    });

    const expiresInSeconds = MS_IN_HOUR / 1000;

    if (refreshToken) {
      await this.spotifyAuthService.storeTokens(
        user.spotifyUserId,
        accessToken,
        refreshToken,
        expiresInSeconds,
      );
    } else {
      await this.spotifyAuthService.storeAccessTokenOnly(
        user.spotifyUserId,
        accessToken,
        expiresInSeconds,
      );
    }

    return this.sessionService.createSession(
      user.spotifyUserId,
      user.displayName,
      user.isTrusted,
    );
  }
}
