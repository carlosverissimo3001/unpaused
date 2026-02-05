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
import { LIKED_SONGS_ID_SUFFIX } from '../../consts';

@Injectable()
export class PlaylistService {
  private readonly logger: AppLoggerService;

  constructor(
    private spotifyService: SpotifyService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(PlaylistService.name);
  }

  /**
   * Get playlist by ID (metadata only, no tracks).
   * Handles Liked Songs via getLikedSongs; regular playlists via Spotify getPlaylist.
   */
  async getPlaylistById(
    sessionId: string,
    playlistId: string,
  ): Promise<PlaylistDto> {
    if (playlistId.endsWith(LIKED_SONGS_ID_SUFFIX)) {
      return this.getLikedSongs(sessionId);
    }
    const { sdk } = await this.spotifyService.getClient(sessionId);
    const playlist = await sdk.playlists.getPlaylist(playlistId);
    return mapPlaylistLite(playlist);
  }

  /**
   * Get current user's playlists
   */
  async getMyPlaylists(
    params: GetPlaylistsDto & { sessionId: string },
  ): Promise<PlaylistsResponseDto> {
    const {
      sessionId,
      limit = 20,
      offset = 0,
      includePrivate = false,
      onlyUserOwned = false,
    } = params;

    const { sdk, session } = await this.spotifyService.getClient(sessionId);

    // 1. Fetch playlists from Spotify
    const response = await sdk.currentUser.playlists.playlists(
      limit as 0 | 20 | 50,
      offset,
    );
    const saved = applyFilters(
      response.items,
      { includePrivate, onlyUserOwned },
      session,
    );
    const savedMapped = saved.map((p) => mapPlaylistLite(p as Playlist<Track>));

    const playlists: PlaylistDto[] = [];

    // 2. Only inject "Liked Songs" on the very first page
    if (offset === 0) {
      const likedSongs = await this.getLikedSongs(sessionId);
      playlists.push(likedSongs);
    }

    playlists.push(...savedMapped);

    return {
      items: playlists,
      total: (response.total ?? 0) + 1,
      limit: response.limit ?? limit,
      offset: response.offset ?? offset,
    };
  }

  /**
   * Get liked songs collection
   * @param sessionId - The session ID
   */
  async getLikedSongs(sessionId: string): Promise<PlaylistDto> {
    const { sdk, session } = await this.spotifyService.getClient(sessionId);

    const collection = await sdk.currentUser.tracks.savedTracks(1, 0);

    return {
      id: `${session.spotifyUserId}${LIKED_SONGS_ID_SUFFIX}`,
      name: 'Liked Songs',
      description: 'Your Saved Songs',
      imageUrl: 'https://misc.scdn.co/liked-songs/liked-songs-300.jpg',
      owner: session.displayName,
      totalTracks: collection.total ?? 0,
      isPublic: false,
      externalUrl: 'https://open.spotify.com/collection/tracks',
    };
  }

  /**
   * Get total count of liked tracks (for random offset sampling).
   */
  async getLikedSongsTotal(sessionId: string): Promise<number> {
    const { sdk } = await this.spotifyService.getClient(sessionId);
    const meta = await sdk.currentUser.tracks.savedTracks(1, 0);
    return meta.total ?? 0;
  }

  /**
   * Get one liked track at a given offset (for game: pick random offset until we find one with preview).
   */
  async getOneLikedTrackAtOffset(
    sessionId: string,
    offset: number,
  ): Promise<TrackDto | null> {
    const { sdk } = await this.spotifyService.getClient(sessionId);
    const page = await sdk.currentUser.tracks.savedTracks(1, offset);
    const item = page.items?.[0];

    if (!item?.track) {
      return null;
    }

    return mapTrack(item.track);
  }

  /**
   * Get first batch of liked (saved) tracks. Used when aggregating pool for daily game.
   */
  async getLikedSongsFirstTracks(sessionId: string): Promise<TrackDto[]> {
    const { sdk } = await this.spotifyService.getClient(sessionId);
    const page = await sdk.currentUser.tracks.savedTracks(50, 0);
    const items = page.items ?? [];
    return items
      .filter((item) => !!item.track)
      .map((item) => mapTrack(item.track));
  }

  /**
   * Get first batch of playlist tracks only (no pagination). Used by game to pick one track with preview.
   */
  async getPlaylistFirstTracks(
    sessionId: string,
    playlistId: string,
  ): Promise<TrackDto[]> {
    const { sdk } = await this.spotifyService.getClient(sessionId);
    const playlist = await sdk.playlists.getPlaylist(playlistId);
    const items = playlist.tracks?.items ?? [];
    return items
      .filter(
        (item): item is PlaylistedTrack<Track> & { track: Track } =>
          !!item.track,
      )
      .map((item) => mapTrack(item.track));
  }

  /**
   * Get tracks from multiple playlists (first batch of each). Used by daily game for pool/options.
   * When playlistIds is empty, uses first page of user's playlists.
   */
  async getTracksFromPlaylistIds(
    sessionId: string,
    playlistIds: string[],
  ): Promise<TrackDto[]> {
    let ids = playlistIds;
    if (ids.length === 0) {
      const { items } = await this.getMyPlaylists({
        sessionId,
        limit: 20,
        offset: 0,
        includePrivate: true,
        onlyUserOwned: false,
      });
      ids = items.map((p) => p.id);
    }
    const all: TrackDto[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      try {
        const tracks = id.endsWith(LIKED_SONGS_ID_SUFFIX)
          ? await this.getLikedSongsFirstTracks(sessionId)
          : await this.getPlaylistFirstTracks(sessionId, id);
        for (const t of tracks) {
          if (t.id && !seen.has(t.id)) {
            seen.add(t.id);
            all.push(t);
          }
        }
      } catch (err) {
        this.logger.warn(
          `getTracksFromPlaylistIds: skip playlist ${id}: ${(err as Error).message}`,
        );
      }
    }
    return all;
  }
}
