import { Injectable } from '@nestjs/common';
import { PreviewLookupService } from './preview-lookup.service';
import { RedisService } from '@redis/redis.service';
import {
  TRACK_PREVIEW_CACHE_PREFIX,
  TRACK_PREVIEW_CACHE_TTL,
} from '../../consts';
import { TrackDto } from '../dto/track.dto';
import { TrackRepository } from '../repositories/track.repository';
import { TrackEntity } from '../entities/track.entity';
import { UpsertTrackDto } from '../dto/upsert-track.dto';

@Injectable()
export class TrackService {
  constructor(
    private readonly trackRepository: TrackRepository,
    private readonly previewLookup: PreviewLookupService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<TrackEntity | null> {
    return this.trackRepository.findById(id);
  }

  async findMany(ids: string[]): Promise<TrackEntity[]> {
    return this.trackRepository.findMany(ids);
  }

  async upsertTrack(id: string, data: UpsertTrackDto): Promise<TrackEntity> {
    return this.trackRepository.upsertTrack(id, data);
  }

  /**
   * Get a track with its preview URL
   * @param spotifyTrackId - The Spotify track ID
   * @param trackData - The track data
   * @returns The track with its preview URL
   */
  async getTrackWithPreview(
    spotifyTrackId: string,
    trackData: TrackDto,
  ): Promise<TrackEntity> {
    const cacheKey = `${TRACK_PREVIEW_CACHE_PREFIX}${spotifyTrackId}`;
    const cachedUrl = await this.redis.get(cacheKey);

    // Redis match
    if (cachedUrl) {
      // TODO: Do we really need this??
      return {
        id: spotifyTrackId,
        previewUrl: cachedUrl,
        name: trackData.name,
        artistName: trackData.primaryArtist,
        albumImageUrl: trackData.imageUrl ?? undefined,
        albumName: trackData.albumName ?? undefined,
        albumUrl: trackData.albumId
          ? `https://open.spotify.com/album/${trackData.albumId}`
          : undefined,
        releaseYear: trackData.releaseYear ?? undefined,
        metadata: {},
        lastScrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        allArtists: trackData.allArtists,
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

    const resolvedUrl = await this.previewLookup.getPreviewUrl(spotifyTrackId, {
      title: trackData.name,
      artist: trackData.primaryArtist,
    });

    return await this.trackRepository.upsertTrack(spotifyTrackId, {
      name: trackData.name,
      artistName: trackData.primaryArtist,
      albumImageUrl: trackData.imageUrl,
      albumName: trackData.albumName,
      albumUrl: trackData.albumId
        ? `https://open.spotify.com/album/${trackData.albumId}`
        : undefined,
      releaseYear: trackData.releaseYear,
      previewUrl: resolvedUrl ?? undefined,
      allArtists: trackData.allArtists,
    });
  }
}
