import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';

const APP_TOKEN_CACHE_KEY = 'spotify:app_token';
/** Refresh a bit before actual expiry so a request never races a stale token. */
const APP_TOKEN_EXPIRY_BUFFER_SECONDS = 60;

interface ClientCredentialsResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * App-only Spotify auth (Client Credentials grant).
 *
 * Unlike the PKCE flow in `auth`, this needs a client secret and never
 * represents a user - there is no per-user consent, so it isn't subject to
 * Development Mode's 5-user cap. Used to serve catalog data (search, public
 * playlists) to guests who haven't logged in with Spotify.
 */
@Injectable()
export class SpotifyAppAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly logger: AppLoggerService;
  private inFlightRefresh: Promise<string> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(SpotifyAppAuthService.name);
    this.clientId = this.configService.getOrThrow<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>(
      'SPOTIFY_CLIENT_SECRET',
    );
  }

  /**
   * Returns a cached app access token, refreshing it if missing/expired.
   * Concurrent callers hitting a cold cache share a single refresh instead of
   * each firing their own request at Spotify.
   */
  async getAppAccessToken(): Promise<string> {
    const cached = await this.redis.get(APP_TOKEN_CACHE_KEY);
    if (cached) {
      return cached;
    }

    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    this.inFlightRefresh = this.refresh().finally(() => {
      this.inFlightRefresh = null;
    });
    return this.inFlightRefresh;
  }

  private async refresh(): Promise<string> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Client credentials token request failed: ${body}`);
      throw new InternalServerErrorException(
        'Spotify app authentication failed',
      );
    }

    const data = (await response.json()) as ClientCredentialsResponse;
    const ttl = Math.max(
      data.expires_in - APP_TOKEN_EXPIRY_BUFFER_SECONDS,
      APP_TOKEN_EXPIRY_BUFFER_SECONDS,
    );
    await this.redis.set(APP_TOKEN_CACHE_KEY, data.access_token, ttl);

    return data.access_token;
  }
}
