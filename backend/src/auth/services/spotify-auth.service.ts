import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { SpotifyService } from './spotify.service';
import { UserRepository } from '../repositories/user.repository';
import { AppLoggerService } from '../../logger/logger.service';
import { encryptToken, decryptToken } from '../utils/token-encryption';

const ACCESS_TOKEN_KEY_PREFIX = 'spotify:access_token:';

@Injectable()
export class SpotifyAuthService {
  private readonly logger: AppLoggerService;
  private readonly encryptionKey: string;
  private readonly inFlightRefreshes = new Map<string, Promise<string>>();

  constructor(
    private readonly redisService: RedisService,
    private readonly spotifyService: SpotifyService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(SpotifyAuthService.name);
    this.encryptionKey = this.configService.getOrThrow<string>(
      'TOKEN_ENCRYPTION_KEY',
    );
  }

  /**
   * Stores access token in Redis with TTL and encrypted refresh token in DB.
   */
  async storeTokens(
    spotifyUserId: string,
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
  ): Promise<void> {
    await this.redisService.set(
      `${ACCESS_TOKEN_KEY_PREFIX}${spotifyUserId}`,
      accessToken,
      expiresInSeconds,
    );

    const encrypted = encryptToken(refreshToken, this.encryptionKey);
    await this.userRepository.updateRefreshToken(spotifyUserId, encrypted);
  }

  /**
   * Returns a valid access token for the user.
   * Checks Redis cache first; on miss, refreshes from Spotify.
   */
  async getValidAccessToken(spotifyUserId: string): Promise<string> {
    const cached = await this.redisService.get(
      `${ACCESS_TOKEN_KEY_PREFIX}${spotifyUserId}`,
    );
    if (cached) {
      return cached;
    }

    return this.refreshWithDeduplication(spotifyUserId);
  }

  /**
   * Deduplicates concurrent refresh calls for the same user.
   */
  private refreshWithDeduplication(spotifyUserId: string): Promise<string> {
    const existing = this.inFlightRefreshes.get(spotifyUserId);
    if (existing) {
      this.logger.log(`Reusing in-flight refresh for user ${spotifyUserId}`);
      return existing;
    }

    const promise = this.doRefresh(spotifyUserId).finally(() => {
      this.inFlightRefreshes.delete(spotifyUserId);
    });

    this.inFlightRefreshes.set(spotifyUserId, promise);
    return promise;
  }

  /**
   * Performs the actual token refresh against Spotify.
   */
  private async doRefresh(spotifyUserId: string): Promise<string> {
    const encryptedRefreshToken =
      await this.userRepository.getRefreshToken(spotifyUserId);

    if (!encryptedRefreshToken) {
      throw new UnauthorizedException(
        'No refresh token found. Please re-authenticate.',
      );
    }

    const refreshToken = decryptToken(
      encryptedRefreshToken,
      this.encryptionKey,
    );

    const newTokens =
      await this.spotifyService.refreshAccessToken(refreshToken);

    await this.redisService.set(
      `${ACCESS_TOKEN_KEY_PREFIX}${spotifyUserId}`,
      newTokens.accessToken,
      newTokens.expiresIn,
    );

    // If Spotify returned a new refresh token, persist it
    if (newTokens.refreshToken !== refreshToken) {
      const encrypted = encryptToken(
        newTokens.refreshToken,
        this.encryptionKey,
      );
      await this.userRepository.updateRefreshToken(spotifyUserId, encrypted);
    }

    this.logger.log(`Refreshed access token for user ${spotifyUserId}`);
    return newTokens.accessToken;
  }

  /**
   * Stores an access token directly in Redis (used when no refresh token is available).
   */
  async storeAccessTokenOnly(
    spotifyUserId: string,
    accessToken: string,
    expiresInSeconds: number,
  ): Promise<void> {
    await this.redisService.set(
      `${ACCESS_TOKEN_KEY_PREFIX}${spotifyUserId}`,
      accessToken,
      expiresInSeconds,
    );
  }

  /**
   * Deletes the cached access token (used on logout).
   */
  async revokeTokens(spotifyUserId: string): Promise<void> {
    await this.redisService.del(`${ACCESS_TOKEN_KEY_PREFIX}${spotifyUserId}`);
  }
}
