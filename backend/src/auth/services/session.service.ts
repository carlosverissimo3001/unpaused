import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { PkceStateDto } from '../dto/pcke-state.dto';
import { UserSessionDto } from '../dto/user-session.dto';

export interface CreateSessionParams {
  userId: string;
  displayName: string;
  isTrusted: boolean;
  spotifyUserId?: string;
}

@Injectable()
export class SessionService {
  private readonly sessionMaxAge: number;
  private readonly pkceStateTtl = 600; // 10 minutes for PKCE state

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.sessionMaxAge =
      this.configService.get<number>('SESSION_MAX_AGE_SECONDS') || 604800; // 7 days
  }

  /**
   * Store PKCE state temporarily during OAuth flow
   * @param state - The state
   * @param codeVerifier - The code verifier
   */
  async storePkceState(state: string, codeVerifier: string): Promise<void> {
    const data: PkceStateDto = {
      codeVerifier,
      createdAt: Date.now(),
    };
    await this.redisService.set(
      `pkce:${state}`,
      JSON.stringify(data),
      this.pkceStateTtl,
    );
  }

  /**
   * Retrieve and delete PKCE state (one-time use)
   * @param state - The state
   * @returns The PKCE state
   */
  async consumePkceState(state: string): Promise<PkceStateDto> {
    const key = `pkce:${state}`;
    const data = await this.redisService.get(key);
    if (!data) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    await this.redisService.del(key);
    try {
      return JSON.parse(data) as PkceStateDto;
    } catch {
      throw new UnauthorizedException('Corrupted OAuth state');
    }
  }

  /**
   * Create a new user session
   * @param params - The session parameters
   * @returns The session ID
   */
  async createSession(params: CreateSessionParams): Promise<string> {
    const sessionId = uuidv4();

    const session: UserSessionDto = {
      sessionId,
      userId: params.userId,
      spotifyUserId: params.spotifyUserId,
      displayName: params.displayName,
      isTrusted: params.isTrusted,
      createdAt: Date.now(),
    };

    await this.redisService.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      this.sessionMaxAge,
    );

    // Reverse mapping: userId -> sessionId (for multiplayer track pooling)
    await this.redisService.set(
      `user-session:${params.userId}`,
      sessionId,
      this.sessionMaxAge,
    );

    return sessionId;
  }

  /**
   * Get session by ID
   * @param sessionId - The session ID
   * @returns The session
   */
  async getSession(sessionId: string): Promise<UserSessionDto> {
    const data = await this.redisService.get(`session:${sessionId}`);
    if (!data) {
      throw new UnauthorizedException('Session not found');
    }
    let session: UserSessionDto;
    try {
      session = JSON.parse(data) as UserSessionDto;
    } catch {
      throw new UnauthorizedException('Corrupted session data');
    }

    // A session stored before the re-key has no user to resolve against.
    if (!session.userId) {
      throw new UnauthorizedException('Session not found');
    }

    return session;
  }

  /**
   * Refresh the reverse mapping (userId -> sessionId) so it stays
   * alive as long as the user is actively making requests.
   */
  async refreshUserSessionMapping(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.redisService.set(
      `user-session:${userId}`,
      sessionId,
      this.sessionMaxAge,
    );
  }

  /**
   * Get a session ID by user ID (reverse lookup).
   * Returns null if no active session exists for the user.
   */
  async getSessionIdByUserId(userId: string): Promise<string | null> {
    const sessionId = await this.redisService.get(`user-session:${userId}`);
    if (!sessionId) {
      return null;
    }

    // Verify the session still exists (it may have expired)
    const exists = await this.redisService.exists(`session:${sessionId}`);
    if (!exists) {
      await this.redisService.del(`user-session:${userId}`);
      return null;
    }

    return sessionId;
  }

  /**
   * Update the display name stored in an active session.
   * Preserves the remaining TTL so the session expiry is unchanged.
   */
  async updateSessionDisplayName(
    sessionId: string,
    displayName: string,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    const remaining = await this.redisService.ttl(key);
    const session = await this.getSession(sessionId);
    const updated: UserSessionDto = { ...session, displayName };
    await this.redisService.set(
      key,
      JSON.stringify(updated),
      remaining > 0 ? remaining : this.sessionMaxAge,
    );
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    try {
      // Clean up reverse mapping before deleting the session
      const data = await this.redisService.get(sessionKey);
      if (data) {
        try {
          const session = JSON.parse(data) as UserSessionDto;
          const userSessionKey = `user-session:${session.userId}`;
          const currentSessionId = await this.redisService.get(userSessionKey);

          // Only delete the reverse mapping if it still points to this session
          if (currentSessionId === sessionId) {
            await this.redisService.del(userSessionKey);
          }
        } catch {
          // Ignore parse errors during cleanup
        }
      }
    } finally {
      await this.redisService.del(sessionKey);
    }
  }
}
