import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { SpotifyTokenResponseDto } from '../dto/spotify/spotify-token-response.dto';
import { SpotifyTokenDto } from '../dto/spotify/spotify-token.dto';
import { SpotifyUserProfileResponseDto } from '../dto/spotify/spotify-user-profile-response.dto';
import { SCOPES } from '../consts';

@Injectable()
export class SpotifyService {
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.getOrThrow<string>('SPOTIFY_CLIENT_ID');
    this.redirectUri = this.configService.getOrThrow<string>(
      'SPOTIFY_REDIRECT_URI',
    );
  }

  /**
   * Generate PKCE code verifier (random 43-128 chars)
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier (SHA256 + base64url)
   */
  generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * Build Spotify authorization URL with PKCE
   */
  buildAuthUrl(state: string, codeChallenge: string): string {
    const scope = SCOPES.join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope,
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param code - The authorization code received from Spotify
   * @param codeVerifier - The PKCE code verifier
   * @returns The Spotify tokens (inclues access and refresh tokens)
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<SpotifyTokenDto> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Spotify token exchange failed: ${error}`);
    }

    const data = (await response.json()) as SpotifyTokenResponseDto;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token
   * @returns The new Spotify tokens (refreshed access token and possibly new refresh token, if provided)
   */
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenDto> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Spotify token refresh failed: ${error}`);
    }

    const data = (await response.json()) as SpotifyTokenResponseDto;

    return {
      accessToken: data.access_token,
      // Spotify may or may not return a new refresh token
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  /**
   * Fetch user profile from Spotify /me endpoint
   * @param accessToken - The access token to use for the request
   * @returns The user profile
   */
  async getUserProfile(accessToken: string): Promise<UserProfileDto> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new UnauthorizedException('Spotify token is invalid or expired');
      }
      throw new BadRequestException(`Spotify API returned ${response.status}`);
    }

    const profileResponse =
      (await response.json()) as SpotifyUserProfileResponseDto;

    return {
      id: profileResponse.id,
      displayName: profileResponse.display_name,
      avatarUrl: profileResponse.images?.[0]?.url ?? '/default-avatar.png',
    };
  }
}
