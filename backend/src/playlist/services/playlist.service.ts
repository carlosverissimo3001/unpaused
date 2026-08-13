import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Track } from '@spotify/web-api-ts-sdk';
import { PlaylistsResponseDto } from '../dto/playlist-response.dto';
import { PlaylistDto } from '../dto/playlist.dto';
import { GetPlaylistsDto } from '../dto/get-playlists-dto';
import {
  applyFilters,
  mapPlaylistLite,
  sortPlaylists,
} from '../utils/playlist-utils';
import { SpotifyService } from '../../spotify/services/spotify.service';
import { mapSpotifyTrackToTrackEntity } from '../../utils/mappers';
import { TrackDto } from '@/track/dto/track.dto';
import { AppLoggerService } from '../../logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import { LIKED_SONGS_ID_SUFFIX } from '../../consts';
import {
  LIKED_SONGS_COVER,
  LIKED_SONGS_URL,
  PLAYLIST_SORT_BY,
} from '../consts';
import {
  PLAYLIST_CACHE_PREFIX,
  PLAYLIST_META_CACHE_PREFIX,
  LIKED_META_CACHE_PREFIX,
  PLAYLIST_TRACKS_CACHE_PREFIX,
  LIKED_TRACKS_CACHE_PREFIX,
  PLAYLIST_TOTAL_TRACKS_PREFIX,
  PLAYLIST_CACHE_TTL,
  TRACK_BATCH_CACHE_TTL,
} from '../../consts';

// Feb 2026: Spotify renamed `track` → `item` in playlist item objects (new /items endpoint)
const TRACK_FIELDS =
  'items(item(id,name,artists(name),album(id,name,images,release_date),duration_ms,external_urls,preview_url,is_playable))';

@Injectable()
export class PlaylistService {
  private readonly logger: AppLoggerService;

  constructor(
    private spotifyService: SpotifyService,
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(PlaylistService.name);
  }

  /**
   * Get playlist by ID (metadata only, no tracks).
   * Handles Liked Songs via getLikedSongs; regular playlists via Spotify getPlaylist.
   * Results are cached for 5 hours.
   */
  async getPlaylistById(
    sessionId: string,
    playlistId: string,
  ): Promise<PlaylistDto> {
    if (playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)) {
      return this.getLikedSongsMetadata(sessionId);
    }

    const { sdk, session } = await this.spotifyService.getClient(sessionId);
    const cacheKey = `${PLAYLIST_META_CACHE_PREFIX}${session.spotifyUserId}:${playlistId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const playlist = await this.spotifyService.safeCall(
      () =>
        sdk.playlists.getPlaylist(
          playlistId,
          undefined,
          // Use items(total) for new API (Feb 2026), fallback handled in mapPlaylistLite
          'id,name,description,images,owner(display_name),items(total),public,external_urls',
        ),
      'getPlaylistById',
    );
    const dto = mapPlaylistLite(playlist);
    await this.redis.set(cacheKey, JSON.stringify(dto), PLAYLIST_CACHE_TTL);
    return dto;
  }

  /**
   * Get current user's playlists. Cached per-user for 5 hours.
   */
  async getMyPlaylists(
    params: GetPlaylistsDto & { sessionId: string },
  ): Promise<PlaylistsResponseDto> {
    const {
      sessionId,
      limit = 20,
      offset = 0,
      onlyPublic = false,
      onlyPrivate = false,
      sortBy = PLAYLIST_SORT_BY.DEFAULT,
    } = params;

    const { sdk, session } = await this.spotifyService.getClient(sessionId);

    const cacheKey = `${PLAYLIST_CACHE_PREFIX}${session.spotifyUserId}:${limit}:${offset}:${onlyPublic}:${onlyPrivate}:${sortBy}`;
    const cached = await this.redis.get(cacheKey);

    let savedMapped: PlaylistDto[];
    let total: number;
    let responseLimit: number;
    let responseOffset: number;

    if (cached) {
      const data = JSON.parse(cached);
      savedMapped = data.items;
      total = data.total;
      responseLimit = data.limit;
      responseOffset = data.offset;
    } else {
      const response = await this.spotifyService.safeCall(
        () => sdk.currentUser.playlists.playlists(limit as 0 | 20 | 50, offset),
        'getMyPlaylists',
      );
      const saved = applyFilters(
        response.items,
        { onlyPublic, onlyPrivate },
        session,
      );
      savedMapped = saved.map((p) => mapPlaylistLite(p));
      savedMapped = sortPlaylists(savedMapped, sortBy);
      total = response.total ?? 0;
      responseLimit = response.limit ?? limit;
      responseOffset = response.offset ?? offset;

      await this.redis.set(
        cacheKey,
        JSON.stringify({
          items: savedMapped,
          total,
          limit: responseLimit,
          offset: responseOffset,
        }),
        PLAYLIST_CACHE_TTL,
      );

      await Promise.all(
        savedMapped.map((p) =>
          this.redis.set(
            `${PLAYLIST_TOTAL_TRACKS_PREFIX}${session.spotifyUserId}:${p.id}`,
            String(p.totalTracks),
            PLAYLIST_CACHE_TTL,
          ),
        ),
      );
    }

    const playlists: PlaylistDto[] = [];

    // Only inject "Liked Songs" on the very first page
    if (offset === 0) {
      const likedSongs = await this.getLikedSongsMetadata(sessionId);
      playlists.push(likedSongs);
    }

    playlists.push(...savedMapped);

    return {
      items: playlists,
      total: total + 1,
      limit: responseLimit,
      offset: responseOffset,
    };
  }

  /**
   * Get liked songs metadata (total count). Cached for 5 hours.
   */
  async getLikedSongsMetadata(sessionId: string): Promise<PlaylistDto> {
    const { sdk, session } = await this.spotifyService.getClient(sessionId);
    const cacheKey = `${LIKED_META_CACHE_PREFIX}${session.spotifyUserId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const collection = await this.spotifyService.safeCall(
      () => sdk.currentUser.tracks.savedTracks(1, 0),
      'getLikedSongsMetadata',
    );

    const dto: PlaylistDto = {
      id: `${session.spotifyUserId}${LIKED_SONGS_ID_SUFFIX}`,
      name: 'Liked Songs',
      description: 'Your Saved Songs',
      imageUrl: LIKED_SONGS_COVER,
      owner: session.displayName,
      totalTracks: collection.total ?? 0,
      isPublic: false,
      externalUrl: LIKED_SONGS_URL,
    };

    await this.redis.set(cacheKey, JSON.stringify(dto), PLAYLIST_CACHE_TTL);
    return dto;
  }

  /**
   * Get a batch of liked tracks at a random offset. Cached for 5 hours.
   * Used by game service for batch-first track selection.
   */
  async getLikedTracksBatch(
    sessionId: string,
    offset: number,
  ): Promise<TrackDto[]> {
    const { sdk, session } = await this.spotifyService.getClient(sessionId);
    const cacheKey = `${LIKED_TRACKS_CACHE_PREFIX}${session.spotifyUserId}:${offset}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const page = await this.spotifyService.safeCall(
      () => sdk.currentUser.tracks.savedTracks(50, offset),
      'getLikedTracksBatch',
    );
    const tracks = (page.items ?? [])
      .filter((item) => !!item.track)
      .map((item) => mapSpotifyTrackToTrackEntity(item.track));

    await this.redis.set(
      cacheKey,
      JSON.stringify(tracks),
      TRACK_BATCH_CACHE_TTL,
    );
    return tracks;
  }

  /**
   * Get first batch of playlist tracks using fields filtering. Cached for 5 hours.
   * Uses getPlaylistItems with fields parameter to minimize payload.
   */
  async getPlaylistFirstTracks(
    sessionId: string,
    playlistId: string,
  ): Promise<TrackDto[]> {
    const { session, accessToken } =
      await this.spotifyService.getClient(sessionId);

    const totalKey = `${PLAYLIST_TOTAL_TRACKS_PREFIX}${session.spotifyUserId}:${playlistId}`;
    const totalRaw = await this.redis.get(totalKey);
    let total = totalRaw ? parseInt(totalRaw, 10) : 0;

    // Fallback: playlist accessed before getMyPlaylists was called (e.g. deep link / bookmark)
    if (total === 0) {
      const meta = await this.getPlaylistById(sessionId, playlistId);
      total = meta.totalTracks;
      if (total > 0) {
        await this.redis.set(totalKey, String(total), PLAYLIST_CACHE_TTL);
      }
    }

    const offset =
      total > 0 ? Math.floor(Math.random() * Math.max(1, total - 49)) : 0;

    const cacheKey = `${PLAYLIST_TRACKS_CACHE_PREFIX}${session.spotifyUserId}:${playlistId}:${offset}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Feb 2026: GET /playlists/{id}/tracks is deprecated. Use /items instead.
    const params = new URLSearchParams({
      fields: TRACK_FIELDS,
      limit: '50',
      offset: String(offset),
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
      throw new Error(
        `Spotify playlist items request failed (${rawResponse.status}): ${body}`,
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
      TRACK_BATCH_CACHE_TTL,
    );
    return tracks;
  }
}
