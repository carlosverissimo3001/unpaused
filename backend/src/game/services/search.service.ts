import { Injectable } from '@nestjs/common';
import { SpotifyService } from '../../spotify/services/spotify.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { normalizeText } from '@utils/text';
import { getFirstImage } from '@utils/utils';
import { Track } from '@spotify/web-api-ts-sdk';

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
    // NOTE: Limit capped at 10 due to SDK/API quirk - values >10 throw "Invalid limit"
    // despite official docs stating 0-50 is valid. Possibly SDK v1.2.0 bug or account limit.
    // See: https://developer.spotify.com/documentation/web-api/reference/search
    const result = await sdk.search(trimmed, ['track'], undefined, 10);

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
