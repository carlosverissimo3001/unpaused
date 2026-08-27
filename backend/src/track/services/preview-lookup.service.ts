import { Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { PreviewScraperService } from './preview-scraper.service';
import { isSameTrack } from './preview-match';
import {
  DEEZER_ISRC_URL,
  DEEZER_TRACK_URL,
  DEEZER_SEARCH_URL,
  ITUNES_SEARCH_URL,
  PREVIEW_CACHE_PREFIX,
  PREVIEW_CACHE_TTL_SECONDS,
  PREVIEW_LOOKUP_TIMEOUT_MS,
  PREVIEW_NOT_FOUND,
  PREVIEW_NOT_FOUND_TTL_SECONDS,
} from '../consts';

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
  id?: number;
  title?: string;
  artist?: { name?: string };
  preview?: string;
  isrc?: string;
  link?: string;
  release_date?: string;
  album?: {
    title?: string;
    cover_xl?: string;
    cover_big?: string;
    link?: string;
  };
}

type Source = 'isrc' | 'itunes' | 'deezer' | 'scrape';

/**
 * What we cache instead of the URL itself. Deezer signs its preview links with
 * a ~15 minute expiry, so only its track id is worth keeping.
 */
export interface PreviewRef {
  source: Source;
  value: string;
}

const DEEZER_SOURCES: Source[] = ['isrc', 'deezer'];

export function serializeRef(ref: PreviewRef): string {
  return `${ref.source}|${ref.value}`;
}

export function parseRef(raw: string): PreviewRef | null {
  const separator = raw.indexOf('|');
  if (separator < 0) {
    return null;
  }
  const source = raw.slice(0, separator) as Source;
  const value = raw.slice(separator + 1);
  return value ? { source, value } : null;
}

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
    const ref = await this.getPreviewRef(trackId, query);
    return ref ? this.mint(ref) : null;
  }

  /** Resolves a playable URL from a ref, re-minting the ones that expire. */
  async mint(ref: PreviewRef): Promise<string | null> {
    if (!DEEZER_SOURCES.includes(ref.source)) {
      return ref.value;
    }
    const track = await this.getJson<DeezerTrack>(
      `${DEEZER_TRACK_URL}${encodeURIComponent(ref.value)}`,
    );
    return track?.preview ?? null;
  }

  async getPreviewRef(
    trackId: string,
    query: PreviewQuery,
  ): Promise<PreviewRef | null> {
    const cacheKey = `${PREVIEW_CACHE_PREFIX}${trackId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return cached === PREVIEW_NOT_FOUND ? null : parseRef(cached);
    }

    const found = await this.lookup(trackId, query);

    if (found) {
      await this.redis.set(
        cacheKey,
        serializeRef(found),
        PREVIEW_CACHE_TTL_SECONDS,
      );
      if (found.source === 'scrape') {
        this.logger.warn(`Preview for ${trackId} only resolved by scraping`);
      }
      return found;
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
  ): Promise<PreviewRef | null> {
    const attempts: [Source, () => Promise<string | null>][] = [
      ['isrc', () => this.fromDeezerIsrc(query.isrc)],
      ['itunes', () => this.fromItunes(query)],
      ['deezer', () => this.fromDeezerSearch(query)],
      ['scrape', () => this.scraper.scrape(trackId)],
    ];

    for (const [source, attempt] of attempts) {
      try {
        const value = await attempt();
        if (value) {
          return { source, value };
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
    return track?.preview && track.id ? String(track.id) : null;
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
        track.id &&
        isSameTrack(
          { title: track.title ?? '', artist: track.artist?.name ?? '' },
          query,
        ),
    );
    return hit?.id ? String(hit.id) : null;
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
