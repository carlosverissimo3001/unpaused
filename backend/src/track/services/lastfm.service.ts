import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LastfmDataVo } from '../vo/track-metadata.vo';

interface LastfmTrackInfoResponse {
  track?: {
    toptags?: { tag?: Array<{ name: string }> };
    wiki?: { summary?: string };
    playcount?: string;
    listeners?: string;
  };
}

@Injectable()
export class LastfmService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LAST_FM_API_KEY');
  }

  async getTrackInfo(
    trackName: string,
    artistName: string,
  ): Promise<LastfmDataVo | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        method: 'track.getInfo',
        api_key: this.apiKey,
        artist: artistName,
        track: trackName,
        format: 'json',
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as LastfmTrackInfoResponse;
      return this.parseResponse(data);
    } catch {
      return null;
    }
  }

  private parseResponse(data: LastfmTrackInfoResponse): LastfmDataVo | null {
    const track = data.track;
    if (!track) {
      return null;
    }

    const tags = (track.toptags?.tag ?? [])
      .map((t) => t.name)
      .filter(Boolean)
      .slice(0, 5);

    const playcount = track.playcount
      ? parseInt(track.playcount, 10)
      : undefined;

    return {
      tags,
      playcount: Number.isFinite(playcount) ? playcount : undefined,
      fetchedAt: new Date().toISOString(),
    };
  }
}
