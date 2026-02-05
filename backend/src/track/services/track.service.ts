import { Injectable } from '@nestjs/common';
import { PreviewScraperService } from './preview-scraper.service';
import { RedisService } from '@redis/redis.service';
import {
  TRACK_PREVIEW_CACHE_PREFIX,
  TRACK_PREVIEW_CACHE_TTL,
} from '../../consts';
import { Track } from '@prisma/client';
import { TrackDto } from '../dto/track.dto';
import { TrackRepository } from '../repositories/track.repository';

@Injectable()
export class TrackService {
  constructor(
    private readonly trackRepository: TrackRepository,
    private readonly previewScraper: PreviewScraperService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get a track with its preview URL
   * @param spotifyTrackId - The Spotify track ID
   * @param trackData - The track data
   * @returns The track with its preview URL
   */
  async getTrackWithPreview(
    spotifyTrackId: string,
    trackData: TrackDto,
  ): Promise<Track> {
    const cacheKey = `${TRACK_PREVIEW_CACHE_PREFIX}${spotifyTrackId}`;
    const cachedUrl = await this.redis.get(cacheKey);

    // Redis match
    if (cachedUrl) {
      // Return a partial that satisfies the Prisma Track model
      return {
        id: spotifyTrackId,
        previewUrl: cachedUrl,
        name: trackData.name,
        artistName: trackData.primaryArtist,
        albumImageUrl: trackData.imageUrl ?? null,
        albumName: trackData.albumName ?? null,
        albumUrl: trackData.albumId
          ? `https://open.spotify.com/album/${trackData.albumId}`
          : null,
        releaseYear: trackData.releaseYear ?? null,
        lastScrapedAt: new Date(),
        createdAt: new Date(),
      };
    }

    // DB match
    const existingTrack = await this.trackRepository.findById(spotifyTrackId);
    if (existingTrack?.previewUrl) {
      await this.redis.set(
        cacheKey,
        existingTrack.previewUrl,
        TRACK_PREVIEW_CACHE_TTL,
      );
      return existingTrack;
    }

    // Scrape fallback
    const scrapedUrl = await this.previewScraper.getPreviewUrl(spotifyTrackId);

    return await this.trackRepository.upsertTrack(spotifyTrackId, {
      name: trackData.name,
      artistName: trackData.primaryArtist,
      albumImageUrl: trackData.imageUrl,
      albumName: trackData.albumName,
      albumUrl: trackData.albumId
        ? `https://open.spotify.com/album/${trackData.albumId}`
        : null,
      releaseYear: trackData.releaseYear,
      previewUrl: scrapedUrl,
    });
  }
}
