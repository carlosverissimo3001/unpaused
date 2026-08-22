import { Test } from '@nestjs/testing';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { PreviewScraperService } from './preview-scraper.service';
import { PreviewLookupService } from './preview-lookup.service';
import {
  PREVIEW_CACHE_TTL_SECONDS,
  PREVIEW_NOT_FOUND,
  PREVIEW_NOT_FOUND_TTL_SECONDS,
} from './preview-lookup.constants';

const QUERY = { title: 'Umbrella', artist: 'Rihanna' };
const ITUNES_URL = 'https://audio.itunes/preview.m4a';
const DEEZER_URL = 'https://cdns-preview.dzcdn.net/preview.mp3';

function itunesResponse(results: unknown[]) {
  return { ok: true, text: async () => JSON.stringify({ results }) };
}
function deezerResponse(data: unknown[]) {
  return { ok: true, text: async () => JSON.stringify({ data }) };
}

describe('PreviewLookupService', () => {
  let service: PreviewLookupService;
  let redis: { get: jest.Mock; set: jest.Mock };
  let scraper: { scrape: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    scraper = { scrape: jest.fn().mockResolvedValue(null) };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const moduleRef = await Test.createTestingModule({
      providers: [
        PreviewLookupService,
        { provide: RedisService, useValue: redis },
        { provide: PreviewScraperService, useValue: scraper },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), log: jest.fn() }) },
        },
      ],
    }).compile();

    service = moduleRef.get(PreviewLookupService);
  });

  it('returns a cached url without calling out', async () => {
    redis.get.mockResolvedValue(ITUNES_URL);

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBe(ITUNES_URL);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null for a cached miss without retrying', async () => {
    redis.get.mockResolvedValue(PREVIEW_NOT_FOUND);

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prefers iTunes and never reaches Deezer or the scraper', async () => {
    fetchMock.mockResolvedValueOnce(
      itunesResponse([
        { trackName: 'Umbrella', artistName: 'Rihanna', previewUrl: ITUNES_URL },
      ]),
    );

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBe(ITUNES_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(scraper.scrape).not.toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalledWith(
      'preview:t1',
      ITUNES_URL,
      PREVIEW_CACHE_TTL_SECONDS,
    );
  });

  it('ignores an iTunes hit for a different song and falls through to Deezer', async () => {
    fetchMock
      .mockResolvedValueOnce(
        itunesResponse([
          {
            trackName: 'Umbrella',
            artistName: 'The Baseballs',
            previewUrl: 'https://wrong.example/preview.m4a',
          },
        ]),
      )
      .mockResolvedValueOnce(
        deezerResponse([
          { title: 'Umbrella', artist: { name: 'Rihanna' }, preview: DEEZER_URL },
        ]),
      );

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBe(DEEZER_URL);
  });

  it('uses the ISRC lookup first when one is known', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ preview: DEEZER_URL }),
    });

    await expect(
      service.getPreviewUrl('t1', { ...QUERY, isrc: 'USUM70706128' }),
    ).resolves.toBe(DEEZER_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('isrc:USUM70706128');
  });

  it("treats Deezer's 200-with-error-body for an unknown ISRC as a miss", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ error: { type: 'DataException', code: 800 } }),
      })
      .mockResolvedValueOnce(
        itunesResponse([
          { trackName: 'Umbrella', artistName: 'Rihanna', previewUrl: ITUNES_URL },
        ]),
      );

    await expect(
      service.getPreviewUrl('t1', { ...QUERY, isrc: 'NOTAREALISRC' }),
    ).resolves.toBe(ITUNES_URL);
  });

  it('falls back to scraping only when both catalogues miss', async () => {
    fetchMock
      .mockResolvedValueOnce(itunesResponse([]))
      .mockResolvedValueOnce(deezerResponse([]));
    scraper.scrape.mockResolvedValue('https://p.scdn.co/mp3-preview/abc');

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBe(
      'https://p.scdn.co/mp3-preview/abc',
    );
    expect(scraper.scrape).toHaveBeenCalledWith('t1');
  });

  it('survives a source throwing and still tries the next one', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('itunes down'))
      .mockResolvedValueOnce(
        deezerResponse([
          { title: 'Umbrella', artist: { name: 'Rihanna' }, preview: DEEZER_URL },
        ]),
      );

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBe(DEEZER_URL);
  });

  it('caches a miss when every source fails', async () => {
    fetchMock
      .mockResolvedValueOnce(itunesResponse([]))
      .mockResolvedValueOnce(deezerResponse([]));

    await expect(service.getPreviewUrl('t1', QUERY)).resolves.toBeNull();
    expect(redis.set).toHaveBeenCalledWith(
      'preview:t1',
      PREVIEW_NOT_FOUND,
      PREVIEW_NOT_FOUND_TTL_SECONDS,
    );
  });
});
