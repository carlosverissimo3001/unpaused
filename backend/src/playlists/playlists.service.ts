import { Injectable, NotFoundException } from "@nestjs/common";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { AuthService } from "../auth/services/auth.service";
import { PlaylistSummaryDto, PlaylistsResponseDto } from "./dto/playlist.dto";
import { PlaylistDetailsDto } from "./dto/playlist-details.dto";
import { MOCK_PLAYLISTS, MOCK_PLAYLIST_DETAILS } from "./mock-data";

@Injectable()
export class PlaylistsService {
  constructor(private authService: AuthService) {}

  /**
   * Check if we're using mock data (dev session)
   */
  private isDevSession(accessToken: string): boolean {
    return accessToken === "mock_access_token";
  }

  /**
   * Get current user's playlists
   */
  async getMyPlaylists(sessionId: string, limit = 20, offset = 0): Promise<PlaylistsResponseDto> {
    const session = await this.authService.getSessionWithValidToken(sessionId);
    if (!session) {
      throw new NotFoundException("Session not found");
    }

    // Return mock data for dev sessions
    if (this.isDevSession(session.tokens.accessToken)) {
      const paginatedItems = MOCK_PLAYLISTS.slice(offset, offset + limit);
      return {
        items: paginatedItems,
        total: MOCK_PLAYLISTS.length,
        limit,
        offset,
      };
    }

    // Use Spotify SDK for real sessions
    const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token: session.tokens.accessToken,
      token_type: "Bearer",
      expires_in: Math.floor((session.tokens.expiresAt - Date.now()) / 1000),
      refresh_token: session.tokens.refreshToken,
    });

    const response = await sdk.currentUser.playlists.playlists(limit as 0 | 20 | 50, offset);

    return {
      items: response.items.map((p) => this.mapPlaylistSummary(p)),
      total: response.total,
      limit: response.limit,
      offset: response.offset,
    };
  }

  /**
   * Get playlist details by ID (works for any public playlist)
   */
  async getPlaylistById(sessionId: string, playlistId: string): Promise<PlaylistDetailsDto> {
    const session = await this.authService.getSessionWithValidToken(sessionId);
    if (!session) {
      throw new NotFoundException("Session not found");
    }

    // Return mock data for dev sessions
    if (this.isDevSession(session.tokens.accessToken)) {
      const mockPlaylist = MOCK_PLAYLISTS.find((p) => p.id === playlistId);
      if (mockPlaylist) {
        return {
          ...MOCK_PLAYLIST_DETAILS,
          ...mockPlaylist,
        };
      }
      // For unknown IDs in dev mode, return modified mock data
      return {
        ...MOCK_PLAYLIST_DETAILS,
        id: playlistId,
        name: `Playlist ${playlistId}`,
      };
    }

    // Use Spotify SDK for real sessions
    const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token: session.tokens.accessToken,
      token_type: "Bearer",
      expires_in: Math.floor((session.tokens.expiresAt - Date.now()) / 1000),
      refresh_token: session.tokens.refreshToken,
    });

    const playlist = await sdk.playlists.getPlaylist(playlistId);

    return this.mapPlaylistDetails(playlist);
  }

  /**
   * Map Spotify API playlist to our DTO
   */
  private mapPlaylistSummary(playlist: any): PlaylistSummaryDto {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images.map((img: any) => ({
        url: img.url,
        height: img.height,
        width: img.width,
      })),
      owner: {
        id: playlist.owner.id,
        displayName: playlist.owner.display_name || playlist.owner.id,
      },
      totalTracks: playlist.tracks.total,
      public: playlist.public ?? true,
      externalUrl: playlist.external_urls.spotify,
    };
  }

  /**
   * Map Spotify API playlist with tracks to our DTO
   */
  private mapPlaylistDetails(playlist: any): PlaylistDetailsDto {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images.map((img: any) => ({
        url: img.url,
        height: img.height,
        width: img.width,
      })),
      owner: {
        id: playlist.owner.id,
        displayName: playlist.owner.display_name || playlist.owner.id,
      },
      totalTracks: playlist.tracks.total,
      public: playlist.public ?? true,
      externalUrl: playlist.external_urls.spotify,
      tracks: playlist.tracks.items
        .filter((item: any) => item.track) // Filter out null tracks
        .map((item: any) => ({
          addedAt: item.added_at,
          track: {
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists.map((a: any) => ({
              id: a.id,
              name: a.name,
            })),
            album: {
              id: item.track.album.id,
              name: item.track.album.name,
              images: item.track.album.images.map((img: any) => ({
                url: img.url,
                height: img.height,
                width: img.width,
              })),
            },
            durationMs: item.track.duration_ms,
            externalUrl: item.track.external_urls.spotify,
            previewUrl: item.track.preview_url,
            isPlayable: item.track.is_playable ?? true,
          },
        })),
    };
  }
}
