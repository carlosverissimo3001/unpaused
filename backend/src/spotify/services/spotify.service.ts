import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SpotifyClient } from '../interfaces/spotify-client.interface';

@Injectable()
export class SpotifyService {
  constructor(private readonly authService: AuthService) {}

  async getClient(sessionId: string): Promise<SpotifyClient> {
    const session = await this.authService.getSessionWithValidToken(sessionId);

    if (!session) {
      throw new UnauthorizedException('Spotify session expired');
    }

    const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token: session.tokens.accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor((session.tokens.expiresAt - Date.now()) / 1000),
      refresh_token: session.tokens.refreshToken,
    });

    return { sdk, session };
  }
}
