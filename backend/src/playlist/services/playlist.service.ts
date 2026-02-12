import { Injectable } from '@nestjs/common';
import { Playlist, Track, PlaylistedTrack } from '@spotify/web-api-ts-sdk';
import { PlaylistsResponseDto } from '../dto/playlist-response.dto';
import { PlaylistDto } from '../dto/playlist.dto';
import { GetPlaylistsDto } from '../dto/get-playlists-dto';
import { applyFilters, mapPlaylistLite } from '../utils/playlist-utils';
import { SpotifyService } from '../../spotify/services/spotify.service';
import { mapTrack } from '@/track/utils.ts/track-utils';
import { TrackDto } from '@/track/dto/track.dto';
import { AppLoggerService } from '../../logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import { LIKED_SONGS_ID_SUFFIX } from '../../consts';
import { LIKED_SONGS_COVER, LIKED_SONGS_URL } from '../consts';
import {
  PLAYLIST_CACHE_PREFIX,
  PLAYLIST_META_CACHE_PREFIX,
  LIKED_META_CACHE_PREFIX,
  PLAYLIST_TRACKS_CACHE_PREFIX,
  LIKED_TRACKS_CACHE_PREFIX,
  PLAYLIST_CACHE_TTL,
  TRACK_BATCH_CACHE_TTL,
} from '../../consts';

const TRACK_FIELDS =
  'items(track(id,name,artists(name),album(id,name,images,release_date),duration_ms,external_urls,preview_url,is_playable))';

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
          'id,name,description,images,owner(display_name),tracks(total),public,external_urls',
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
      onlyUserOwned = false,
    } = params;

    const { sdk, session } = await this.spotifyService.getClient(sessionId);

    const cacheKey = `${PLAYLIST_CACHE_PREFIX}${session.spotifyUserId}:${limit}:${offset}:${onlyPublic}:${onlyUserOwned}`;
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
        { onlyPublic, onlyUserOwned },
        session,
      );
      savedMapped = saved.map((p) => mapPlaylistLite(p as Playlist<Track>));
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
      .map((item) => mapTrack(item.track));

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
    const { sdk, session } = await this.spotifyService.getClient(sessionId);
    const cacheKey = `${PLAYLIST_TRACKS_CACHE_PREFIX}${session.spotifyUserId}:${playlistId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const response = await this.spotifyService.safeCall(
      () =>
        sdk.playlists.getPlaylistItems(
          playlistId,
          undefined,
          TRACK_FIELDS,
          50,
          0,
        ),
      'getPlaylistFirstTracks',
    );

    const items = response.items ?? [];
    const tracks = items
      .filter(
        (item): item is PlaylistedTrack<Track> & { track: Track } =>
          !!item.track,
      )
      .map((item) => mapTrack(item.track));

    await this.redis.set(
      cacheKey,
      JSON.stringify(tracks),
      TRACK_BATCH_CACHE_TTL,
    );
    return tracks;
  }
}
