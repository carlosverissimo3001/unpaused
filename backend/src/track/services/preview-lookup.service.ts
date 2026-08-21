import { Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { PreviewScraperService } from './preview-scraper.service';
import { isSameTrack } from './preview-match';
import {
  DEEZER_ISRC_URL,
  DEEZER_SEARCH_URL,
  ITUNES_SEARCH_URL,
  PREVIEW_CACHE_PREFIX,
  PREVIEW_CACHE_TTL_SECONDS,
  PREVIEW_LOOKUP_TIMEOUT_MS,
  PREVIEW_NOT_FOUND,
  PREVIEW_NOT_FOUND_TTL_SECONDS,
} from './preview-lookup.constants';

export interface PreviewQuery {
  title: string;
  artist: string;
  isrc?: string;
}

interface ItunesResult {
  trackName?: string;
  artistName?: string;
  previewUrl?: string;
}

interface DeezerTrack {
  title?: string;
  artist?: { name?: string };
  preview?: string;
}

type Source = 'isrc' | 'itunes' | 'deezer' | 'scrape';

@Injectable()
export class PreviewLookupService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    private readonly scraper: PreviewScraperService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(PreviewLookupService.name);
  }

  async getPreviewUrl(
    trackId: string,
    query: PreviewQuery,
  ): Promise<string | null> {
    const cacheKey = `${PREVIEW_CACHE_PREFIX}${trackId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return cached === PREVIEW_NOT_FOUND ? null : cached;
    }

    const found = await this.lookup(trackId, query);

    if (found) {
      await this.redis.set(cacheKey, found.url, PREVIEW_CACHE_TTL_SECONDS);
      if (found.source === 'scrape') {
        this.logger.warn(`Preview for ${trackId} only resolved by scraping`);
      }
      return found.url;
    }

    await this.redis.set(
      cacheKey,
      PREVIEW_NOT_FOUND,
      PREVIEW_NOT_FOUND_TTL_SECONDS,
    );
    return null;
  }

  private async lookup(
    trackId: string,
    query: PreviewQuery,
  ): Promise<{ url: string; source: Source } | null> {
    const attempts: [Source, () => Promise<string | null>][] = [
      ['isrc', () => this.fromDeezerIsrc(query.isrc)],
      ['itunes', () => this.fromItunes(query)],
      ['deezer', () => this.fromDeezerSearch(query)],
      ['scrape', () => this.scraper.scrape(trackId)],
    ];

    for (const [source, attempt] of attempts) {
      try {
        const url = await attempt();
        if (url) {
          return { url, source };
        }
      } catch (error) {
        this.logger.warn(
          `${source} preview lookup failed for ${trackId}: ${(error as Error).message}`,
        );
      }
    }
    return null;
  }

  private async fromDeezerIsrc(isrc?: string): Promise<string | null> {
    if (!isrc) {
      return null;
    }
    const track = await this.getJson<DeezerTrack>(
      `${DEEZER_ISRC_URL}${encodeURIComponent(isrc)}`,
    );
    return track?.preview ?? null;
  }

  private async fromItunes(query: PreviewQuery): Promise<string | null> {
    const params = new URLSearchParams({
      term: `${query.artist} ${query.title}`,
      media: 'music',
      entity: 'song',
      limit: '5',
    });
    const body = await this.getJson<{ results?: ItunesResult[] }>(
      `${ITUNES_SEARCH_URL}?${params}`,
    );
    const hit = (body?.results ?? []).find(
      (result) =>
        result.previewUrl &&
        isSameTrack(
          { title: result.trackName ?? '', artist: result.artistName ?? '' },
          query,
        ),
    );
    return hit?.previewUrl ?? null;
  }

  private async fromDeezerSearch(query: PreviewQuery): Promise<string | null> {
    const params = new URLSearchParams({
      q: `artist:"${query.artist}" track:"${query.title}"`,
      limit: '5',
    });
    const body = await this.getJson<{ data?: DeezerTrack[] }>(
      `${DEEZER_SEARCH_URL}?${params}`,
    );
    const hit = (body?.data ?? []).find(
      (track) =>
        track.preview &&
        isSameTrack(
          { title: track.title ?? '', artist: track.artist?.name ?? '' },
          query,
        ),
    );
    return hit?.preview ?? null;
  }

  private async getJson<T>(url: string): Promise<T | null> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PREVIEW_LOOKUP_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    // iTunes serves its JSON as text/javascript.
    return JSON.parse(await response.text()) as T;
  }
}
