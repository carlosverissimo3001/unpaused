import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { SpotifyAppAuthService } from './spotify-app-auth.service';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';

describe('SpotifyAppAuthService', () => {
  let service: SpotifyAppAuthService;
  let store: Map<string, string>;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    store = new Map();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const redis = {
      get: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
      set: jest.fn((k: string, v: string) => {
        store.set(k, v);
        return Promise.resolve();
      }),
    };

    const logger = {
      child: () => ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() }),
    };

    const configService = {
      getOrThrow: (key: string) =>
        key === 'SPOTIFY_CLIENT_ID' ? 'client-id' : 'client-secret',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotifyAppAuthService,
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: configService },
        { provide: AppLoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(SpotifyAppAuthService);
  });

  it('fetches and caches a token on a cold cache', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'app-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
    });

    const token = await service.getAppAccessToken();

    expect(token).toBe('app-token');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://accounts.spotify.com/api/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(store.get('spotify:app_token')).toBe('app-token');
  });

  it('returns the cached token without calling Spotify again', async () => {
    store.set('spotify:app_token', 'cached-token');

    const token = await service.getAppAccessToken();

    expect(token).toBe('cached-token');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent refreshes on a cold cache', async () => {
    let resolveResponse: (value: unknown) => void;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );

    const first = service.getAppAccessToken();
    const second = service.getAppAccessToken();

    resolveResponse!({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'app-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
    });

    await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when Spotify rejects the client credentials', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('invalid_client'),
    });

    await expect(service.getAppAccessToken()).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
