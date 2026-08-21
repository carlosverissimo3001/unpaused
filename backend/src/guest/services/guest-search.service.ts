import { Injectable } from '@nestjs/common';
import { SpotifyAppAuthService } from '../../spotify/services/spotify-app-auth.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { mapSpotifyTrackToOption } from '../../game/utils/track-option-mapper';

/**
 * Guest equivalent of SearchService: same Spotify catalog search, same
 * TrackOptionDto output, but authenticated with the app-level Client
 * Credentials token instead of a per-user session.
 */
@Injectable()
export class GuestSearchService {
  constructor(private readonly spotifyAppAuth: SpotifyAppAuthService) {}

  async searchTracks(query: string): Promise<TrackOptionDto[]> {
    const trimmed = query?.trim().slice(0, 200) ?? '';
    if (trimmed.length === 0) {
      return [];
    }

    const accessToken = await this.spotifyAppAuth.getAppAccessToken();
    const params = new URLSearchParams({
      q: trimmed,
      type: 'track',
      limit: '10',
    });
    const response = await fetch(
      `https://api.spotify.com/v1/search?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new Error(`Spotify search failed (${response.status})`);
    }

    const data = (await response.json()) as {
      tracks?: { items?: Parameters<typeof mapSpotifyTrackToOption>[0][] };
    };
    const items = data.tracks?.items ?? [];
    return items.map(mapSpotifyTrackToOption);
  }
}
