import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AppLoggerService } from '../../logger/logger.service';
import { type DemoTrack } from '../demo.constants';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

type EmbeddedTrack = {
  uri?: string;
  name?: string;
  artists?: { items?: { profile?: { name?: string } }[] };
  albumOfTrack?: { coverArt?: { sources?: { url: string; width: number }[] } };
  previews?: { audioPreviews?: { items?: { url: string }[] } };
};

type EmbeddedState = {
  entities?: {
    items?: Record<
      string,
      { content?: { items?: { itemV2?: { data?: EmbeddedTrack } }[] } }
    >;
  };
};

/**
 * Reads a Spotify chart playlist from the web player's embedded state.
 *
 * The Web API dropped `preview_url` for new apps in late 2024, which is why
 * the main app scrapes previews at all. The player's own state still carries
 * them, alongside names, artists and cover art, so one request per playlist
 * replaces one request per track.
 *
 * Only the scheduled refresh calls this. Nothing on the request path does.
 */
@Injectable()
export class DemoPlaylistService {
  private readonly logger: AppLoggerService;

  constructor(appLogger: AppLoggerService) {
    this.logger = appLogger.child(DemoPlaylistService.name);
  }

  async fetchTracks(playlistId: string): Promise<DemoTrack[]> {
    const { data } = await axios.get<string>(
      `https://open.spotify.com/playlist/${playlistId}`,
      { headers: { 'User-Agent': USER_AGENT }, timeout: 15_000 },
    );

    const match = /<script id="initialState"[^>]*>(.*?)<\/script>/s.exec(data);
    if (!match) {
      throw new Error('initialState script not found');
    }

    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    const state = JSON.parse(decoded) as EmbeddedState;

    const items =
      state.entities?.items?.[`spotify:playlist:${playlistId}`]?.content
        ?.items ?? [];

    const tracks = items
      .map((item) => this.toTrack(item.itemV2?.data))
      .filter((track): track is DemoTrack => track !== null);

    this.logger.log(
      `Parsed ${tracks.length} playable tracks from ${items.length} items`,
    );
    return tracks;
  }

  private toTrack(data?: EmbeddedTrack): DemoTrack | null {
    const previewUrl = data?.previews?.audioPreviews?.items?.[0]?.url;
    const uri = data?.uri;
    if (!previewUrl || !uri || !data?.name) {
      return null;
    }

    const sources = data.albumOfTrack?.coverArt?.sources ?? [];
    const art = sources.find((s) => s.width >= 300) ?? sources[0];

    return {
      id: uri.split(':').pop() as string,
      name: data.name,
      artistName: (data.artists?.items ?? [])
        .map((a) => a.profile?.name)
        .filter((name): name is string => Boolean(name))
        .join(', '),
      albumImageUrl: art?.url ?? '',
      previewUrl,
    };
  }
}
