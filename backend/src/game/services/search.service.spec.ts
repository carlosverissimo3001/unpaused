import { Test } from '@nestjs/testing';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { SearchService } from './search.service';
import { SEARCH_CACHE_TTL_SECONDS } from '../consts';

const track = (
  id: number,
  title: string,
  artist: string,
  isrc?: string,
): unknown => ({
  id,
  title,
  isrc,
  artist: { name: artist },
  album: { title: 'After Hours', cover_big: 'https://cdn/cover.jpg' },
});

function searchResponse(data: unknown[]) {
  return { ok: true, json: async () => ({ data }) };
}

describe('SearchService', () => {
  let service: SearchService;
  let redis: { get: jest.Mock; set: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: RedisService, useValue: redis },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), log: jest.fn() }) },
        },
      ],
    }).compile();

    service = moduleRef.get(SearchService);
  });

  it('maps a hit to an option carrying the ISRC', async () => {
    fetchMock.mockResolvedValue(
      searchResponse([track(1, 'Blinding Lights', 'The Weeknd', 'USUG11904206')]),
    );

    const [option] = await service.searchTracks('blinding lights');

    expect(option).toMatchObject({
      id: '1',
      name: 'Blinding Lights',
      artist: 'The Weeknd',
      isrc: 'USUG11904206',
      albumImageUrl: 'https://cdn/cover.jpg',
    });
  });

  it('collapses releases that share an ISRC into one option', async () => {
    fetchMock.mockResolvedValue(
      searchResponse([
        track(1, 'Blinding Lights', 'The Weeknd', 'USUG11904206'),
        track(2, 'Blinding Lights', 'The Weeknd', 'USUG11904206'),
        track(3, 'Blinding Lights', 'The Weeknd', 'USUG11904207'),
      ]),
    );

    const options = await service.searchTracks('blinding lights');

    expect(options).toHaveLength(2);
    expect(options.map((o) => o.id)).toEqual(['1', '3']);
  });

  it('falls back to title and artist when a hit has no ISRC', async () => {
    fetchMock.mockResolvedValue(
      searchResponse([
        track(1, 'Umbrella', 'Rihanna'),
        track(2, 'umbrella', 'RIHANNA'),
      ]),
    );

    await expect(service.searchTracks('umbrella')).resolves.toHaveLength(1);
  });

  it("treats Deezer's 200-with-error-body as no results", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ error: { code: 4, message: 'Quota limit exceeded' } }),
    });

    await expect(service.searchTracks('umbrella')).resolves.toEqual([]);
  });

  it('returns nothing rather than throwing when Deezer is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    await expect(service.searchTracks('umbrella')).resolves.toEqual([]);
  });

  it('ignores malformed hits', async () => {
    fetchMock.mockResolvedValue(
      searchResponse([
        { id: 1, title: 'No Artist' },
        { title: 'No Id', artist: { name: 'Someone' } },
        track(3, 'Real One', 'Someone', 'AA6Q72000047'),
      ]),
    );

    const options = await service.searchTracks('anything');
    expect(options.map((o) => o.id)).toEqual(['3']);
  });

  it('skips the round trip for a query below the minimum length', async () => {
    await expect(service.searchTracks('a')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves a repeat query from cache', async () => {
    redis.get.mockResolvedValue(JSON.stringify([{ id: '1', name: 'cached' }]));

    const options = await service.searchTracks('blinding lights');

    expect(options).toEqual([{ id: '1', name: 'cached' }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('caches by a case-insensitive key so casing does not fragment it', async () => {
    fetchMock.mockResolvedValue(searchResponse([]));

    await service.searchTracks('  Blinding LIGHTS  ');

    expect(redis.set).toHaveBeenCalledWith(
      'search:blinding lights',
      expect.any(String),
      SEARCH_CACHE_TTL_SECONDS,
    );
  });

  it('caches an empty result so a miss is not retried on every keystroke', async () => {
    fetchMock.mockResolvedValue(searchResponse([]));

    await service.searchTracks('zzzznotathing');

    expect(redis.set).toHaveBeenCalledWith(
      'search:zzzznotathing',
      '[]',
      SEARCH_CACHE_TTL_SECONDS,
    );
  });
});
