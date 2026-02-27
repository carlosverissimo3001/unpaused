import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SpotifyClient } from '../interfaces/spotify-client.interface';
import { AppLoggerService } from '../../logger/logger.service';
import { handleSpotifyError } from '../../utils/handlers/handler';

@Injectable()
export class SpotifyService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly authService: AuthService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(SpotifyService.name);
  }

  async getClient(sessionId: string): Promise<SpotifyClient> {
    const { session, accessToken } =
      await this.authService.getValidAccessToken(sessionId);

    if (!session) {
      throw new UnauthorizedException('Spotify session expired');
    }

    const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: '',
    });

    return { sdk, session, accessToken };
  }

  /**
   * Wraps any Spotify SDK call with rate-limit protection.
   * Catches 429 errors, logs the Retry-After duration, and throws a user-friendly error.
   */
  async safeCall<T>(fn: () => Promise<T>, context: string): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      handleSpotifyError(error, context, this.logger);
      throw error; // unreachable if handleSpotifyError throws, but satisfies TS
    }
  }
}
