import { Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { normalizeText } from '@utils/text';
import {
  SEARCH_API_URL,
  SEARCH_CACHE_PREFIX,
  SEARCH_CACHE_TTL_SECONDS,
  SEARCH_FETCH_LIMIT,
  SEARCH_MAX_OPTIONS,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_TIMEOUT_MS,
} from '../consts';

interface DeezerSearchTrack {
  id?: number;
  title?: string;
  isrc?: string;
  artist?: { name?: string };
  album?: { title?: string; cover_big?: string; cover_medium?: string };
}

@Injectable()
export class SearchService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(SearchService.name);
  }

  async searchTracks(query: string): Promise<TrackOptionDto[]> {
    const trimmed = (query ?? '').trim().slice(0, SEARCH_MAX_QUERY_LENGTH);
    if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
      return [];
    }

    const cacheKey = `${SEARCH_CACHE_PREFIX}${trimmed.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached) as TrackOptionDto[];
    }

    const options = this.toOptions(await this.fetchTracks(trimmed));
    await this.redis.set(
      cacheKey,
      JSON.stringify(options),
      SEARCH_CACHE_TTL_SECONDS,
    );
    return options;
  }

  private async fetchTracks(query: string): Promise<DeezerSearchTrack[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(SEARCH_FETCH_LIMIT),
    });
    try {
      const response = await fetch(`${SEARCH_API_URL}?${params}`, {
        signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Deezer search failed (${response.status})`);
        return [];
      }
      const body = (await response.json()) as {
        data?: DeezerSearchTrack[];
        error?: Record<string, unknown>;
      };
      // Deezer answers 200 with an error body when its quota is exceeded.
      if (body?.error && Object.keys(body.error).length > 0) {
        this.logger.warn(
          `Deezer search refused: ${JSON.stringify(body.error)}`,
        );
        return [];
      }
      return body?.data ?? [];
    } catch (error) {
      this.logger.warn(`Deezer search errored: ${(error as Error).message}`);
      return [];
    }
  }

  /** Deezer lists every release of a recording; the dropdown wants one row each. */
  private toOptions(tracks: DeezerSearchTrack[]): TrackOptionDto[] {
    const seen = new Set<string>();
    const options: TrackOptionDto[] = [];

    for (const track of tracks) {
      if (!track.id || !track.title || !track.artist?.name) {
        continue;
      }
      const artist = track.artist.name;
      const key =
        track.isrc ??
        `${normalizeText(track.title).toLowerCase()}|${normalizeText(artist).toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      options.push({
        id: String(track.id),
        name: track.title,
        normalizedName: normalizeText(track.title),
        artist,
        normalizedArtist: normalizeText(artist),
        isrc: track.isrc,
        albumName: track.album?.title,
        albumImageUrl: track.album?.cover_big ?? track.album?.cover_medium,
      });

      if (options.length >= SEARCH_MAX_OPTIONS) {
        break;
      }
    }

    return options;
  }
}
