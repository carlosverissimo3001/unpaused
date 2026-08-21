import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Track } from '@spotify/web-api-ts-sdk';
import { RedisService } from '@redis/redis.service';
import { SpotifyAppAuthService } from '../../spotify/services/spotify-app-auth.service';
import { mapSpotifyTrackToTrackEntity } from '../../utils/mappers';
import { TrackDto } from '../../track/dto/track.dto';
import { AppLoggerService } from '../../logger/logger.service';
import {
  GUEST_PLAYLIST_IDS,
  GUEST_PLAYLIST_TRACKS_CACHE_PREFIX,
  GUEST_PLAYLIST_TRACKS_CACHE_TTL,
} from '../guest.constants';

// Feb 2026: Spotify renamed `track` → `item` in playlist item objects.
const TRACK_FIELDS =
  'items(item(id,name,artists(name),album(id,name,images,release_date),duration_ms,external_urls,preview_url,is_playable))';

/**
 * Fetches tracks from the curated guest playlist pool using the app-level
 * Client Credentials token - no per-user session involved, so this works for
 * a visitor who has never logged in. Cached per playlist (not per user, since
 * there's no user), so the cache is shared across every guest.
 */
@Injectable()
export class GuestPlaylistService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly spotifyAppAuth: SpotifyAppAuthService,
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(GuestPlaylistService.name);
  }

  /** Picks a random configured playlist and returns its first batch of tracks. */
  async getRandomPlaylistTracks(): Promise<TrackDto[]> {
    const playlistId =
      GUEST_PLAYLIST_IDS[Math.floor(Math.random() * GUEST_PLAYLIST_IDS.length)];
    return this.getPlaylistTracks(playlistId);
  }

  private async getPlaylistTracks(playlistId: string): Promise<TrackDto[]> {
    const cacheKey = `${GUEST_PLAYLIST_TRACKS_CACHE_PREFIX}${playlistId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const accessToken = await this.spotifyAppAuth.getAppAccessToken();
    const params = new URLSearchParams({
      fields: TRACK_FIELDS,
      limit: '50',
    });
    const rawResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (rawResponse.status === HttpStatus.TOO_MANY_REQUESTS) {
      const retryAfter = rawResponse.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) : 60;
      throw new HttpException(
        `Rate limited. Try again in ${waitTime}s`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!rawResponse.ok) {
      const body = await rawResponse.text();
      this.logger.warn(
        `Guest playlist fetch failed (${rawResponse.status}) for ${playlistId}: ${body}`,
      );
      throw new Error(
        `Spotify playlist items request failed (${rawResponse.status})`,
      );
    }

    const response = (await rawResponse.json()) as {
      items?: Array<{ item?: Track; track?: Track }>;
    };
    const items = response.items ?? [];
    const tracks = items
      .filter((item) => !!(item.item?.id ?? item.track?.id))
      .map((item) =>
        mapSpotifyTrackToTrackEntity((item.item ?? item.track) as Track),
      );

    await this.redis.set(
      cacheKey,
      JSON.stringify(tracks),
      GUEST_PLAYLIST_TRACKS_CACHE_TTL,
    );
    return tracks;
  }
}
