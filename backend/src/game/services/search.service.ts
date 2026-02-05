import { Injectable } from '@nestjs/common';
import { SpotifyService } from '../../spotify/services/spotify.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { normalizeText } from '@utils/text';
import { getFirstImage } from '@utils/utils';
import { Track } from '@spotify/web-api-ts-sdk';

const SEARCH_LIMIT = 20 as const;

@Injectable()
export class SearchService {
  constructor(private readonly spotifyService: SpotifyService) {}

  /**
   * Search Spotify for tracks (for game guess dropdown).
   * Uses session's Spotify client; returns TrackOptionDto-shaped items.
   */
  async searchTracks(
    sessionId: string,
    query: string,
  ): Promise<TrackOptionDto[]> {
    const trimmed = query?.trim().slice(0, 200) ?? '';
    if (trimmed.length === 0) {
      return [];
    }

    const { sdk } = await this.spotifyService.getClient(sessionId);
    const result = await sdk.search(
      trimmed,
      ['track'],
      undefined,
      SEARCH_LIMIT,
      0,
    );

    const items = result.tracks?.items ?? [];
    return items.map((track: Track) => this.mapTrackToOption(track));
  }

  private mapTrackToOption(track: Track): TrackOptionDto {
    const artist = track.artists?.[0]?.name ?? 'Unknown Artist';
    const name = track.name ?? '';
    const albumImageUrl = track.album?.images?.length
      ? getFirstImage(track.album.images)
      : undefined;

    return {
      id: track.id,
      name,
      normalizedName: normalizeText(name),
      artist,
      normalizedArtist: normalizeText(artist),
      albumImageUrl: albumImageUrl || undefined,
      albumName: track.album?.name ?? undefined,
    };
  }
}
