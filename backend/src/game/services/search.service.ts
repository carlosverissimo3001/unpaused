import { Injectable } from '@nestjs/common';
import { SpotifyService } from '../../spotify/services/spotify.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { mapSpotifyTrackToOption } from '../utils/track-option-mapper';

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
    return items.map(mapSpotifyTrackToOption);
  }
}
