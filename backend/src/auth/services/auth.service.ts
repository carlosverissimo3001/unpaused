import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpotifyService } from './spotify.service';
import { SessionService } from './session.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginStartResult } from '../types';
import { UserRepository } from '../repositories/user.repository';
import { AuthMeResponseDto } from '../dto/auth.dto';
import { MS_IN_HOUR, MS_IN_MINUTE } from '../consts';
import { UserSessionDto } from '../dto/user-session.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private spotifyService: SpotifyService,
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

    // fyi: Move this to repo later
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
      tokens,
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
      throw new UnauthorizedException('Session not found');
    }

    const bufferMs = 5 * MS_IN_MINUTE;
    const timeUntilExpiry = session.tokens.expiresAt - Date.now();

    if (timeUntilExpiry < bufferMs) {
      if (
        !session.tokens.refreshToken ||
        session.tokens.refreshToken.trim() === ''
      ) {
        if (timeUntilExpiry <= 0) {
          await this.sessionService.deleteSession(sessionId);
          throw new UnauthorizedException(
            'Session expired and cannot be refreshed',
          );
        }
        return session;
      }

      try {
        const newTokens = await this.spotifyService.refreshAccessToken(
          session.tokens.refreshToken,
        );
        session.tokens = newTokens;
        await this.sessionService.updateSession(session);
      } catch {
        // Refresh failed, session is invalid
        await this.sessionService.deleteSession(sessionId);
        throw new UnauthorizedException('Session invalid');
      }
    }

    return session;
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
   * Logout: delete session
   * @param sessionId - The session ID
   */
  async logout(sessionId: string): Promise<void> {
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

    const tokens = {
      accessToken,
      refreshToken: refreshToken ?? '',
      expiresAt: Date.now() + MS_IN_HOUR,
    };

    return this.sessionService.createSession(
      user.spotifyUserId,
      user.displayName,
      user.isTrusted,
      tokens,
    );
  }
}
