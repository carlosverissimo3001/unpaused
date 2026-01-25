import { Injectable } from "@nestjs/common";
import { Playlist, Track } from "@spotify/web-api-ts-sdk";
import { PlaylistsResponseDto } from "../dto/playlist-response.dto";
import { PlaylistDto } from "../dto/playlist.dto";
import { GetPlaylistsDto } from "../dto/get-playlists-dto";
import { applyFilters, mapPlaylistLite, mapPlaylistWithTracks } from "../utils/playlist-utils";
import { SpotifyService } from "../../spotify/services/spotify.service";

@Injectable()
export class PlaylistsService {
  constructor(
    private spotifyService: SpotifyService
  ) {}

  /**
   * Get current user's playlists
   */
  async getMyPlaylists(params: GetPlaylistsDto & { sessionId: string }): Promise<PlaylistsResponseDto> {
    const { sessionId, limit = 20, offset = 0, includePrivate = false, onlyUserOwned = false } = params;
    
    const { sdk, session } = await this.spotifyService.getClient(sessionId);
    const response = await sdk.currentUser.playlists.playlists(limit as 0 | 20 | 50, offset);

    const playlists = applyFilters(response.items, { includePrivate, onlyUserOwned }, session);

    return {
      items: playlists.map((p) => mapPlaylistLite(p as Playlist<Track>)),
      total: response.total ?? 0,
      limit: response.limit ?? limit,
      offset: response.offset ?? offset,
    };
  }

  /**
   * Get playlist details by ID (works for any public playlist)
   * @param sessionId - The session ID
   * @param playlistId - The playlist ID
   * @returns The playlist details
   */
  async getPlaylistById(sessionId: string, playlistId: string): Promise<PlaylistDto> {
    const { sdk } = await this.spotifyService.getClient(sessionId);
    const playlist = await sdk.playlists.getPlaylist(playlistId);

    return mapPlaylistWithTracks(playlist);
  }
}
