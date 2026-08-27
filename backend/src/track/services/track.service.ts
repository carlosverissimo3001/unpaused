import { Injectable } from '@nestjs/common';
import {
  PreviewLookupService,
  parseRef,
  serializeRef,
} from './preview-lookup.service';
import { TrackDto } from '../dto/track.dto';
import { TrackRepository } from '../repositories/track.repository';
import { TrackEntity } from '../entities/track.entity';
import { UpsertTrackDto } from '../dto/upsert-track.dto';

@Injectable()
export class TrackService {
  constructor(
    private readonly trackRepository: TrackRepository,
    private readonly previewLookup: PreviewLookupService,
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
   * Resolves audio for a track we already hold a row for — a pool track, which
   * is seeded without one because Deezer's preview links expire in minutes.
   *
   * The ref is persisted on first use, so later rounds only re-mint rather than
   * running the whole cascade again.
   */
  /** Seeded from a name and an artist alone, with the rest still to find. */
  private isThin(track: TrackEntity): boolean {
    return (
      !track.albumImageUrl ||
      !track.albumName ||
      !track.releaseYear ||
      !track.isrc
    );
  }

  async resolvePreview(track: TrackEntity): Promise<string | null> {
    const existing = await this.playableUrl(track);
    if (existing) {
      return existing;
    }

    const ref = await this.previewLookup.getPreviewRef(track.id, {
      title: track.name,
      artist: track.artistName,
      isrc: track.isrc,
    });
    if (!ref) {
      return null;
    }

    const url = await this.previewLookup.mint(ref);

    // A track can arrive with nothing but a title and an artist — a special
    // group is seeded that way on purpose. Whatever it is missing is on the
    // record the preview was just minted from, so it is filled in once here
    // rather than being a step somebody has to remember at seed time.
    const details = this.isThin(track)
      ? await this.previewLookup.details(ref)
      : null;

    await this.trackRepository.upsertTrack(track.id, {
      name: track.name,
      artistName: track.artistName,
      albumImageUrl: track.albumImageUrl ?? details?.albumImageUrl,
      albumName: track.albumName ?? details?.albumName,
      albumUrl: track.albumUrl ?? details?.albumUrl,
      releaseYear: track.releaseYear ?? details?.releaseYear,
      isrc: track.isrc ?? details?.isrc,
      previewUrl: url ?? undefined,
      previewRef: serializeRef(ref),
      allArtists: track.allArtists,
    });
    return url;
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
    const existingTrack = await this.trackRepository.findById(spotifyTrackId);
    if (existingTrack?.previewRef) {
      const url = await this.playableUrl(existingTrack);
      if (url) {
        return { ...existingTrack, previewUrl: url };
      }
    }

    const ref = await this.previewLookup.getPreviewRef(spotifyTrackId, {
      title: trackData.name,
      artist: trackData.primaryArtist,
      isrc: trackData.isrc,
    });
    const resolvedUrl = ref ? await this.previewLookup.mint(ref) : null;

    return await this.trackRepository.upsertTrack(spotifyTrackId, {
      name: trackData.name,
      artistName: trackData.primaryArtist,
      albumImageUrl: trackData.imageUrl,
      albumName: trackData.albumName,
      albumUrl: trackData.albumId
        ? `https://open.spotify.com/album/${trackData.albumId}`
        : undefined,
      releaseYear: trackData.releaseYear,
      isrc: trackData.isrc,
      previewUrl: resolvedUrl ?? undefined,
      previewRef: ref ? serializeRef(ref) : undefined,
      allArtists: trackData.allArtists,
    });
  }

  /**
   * The stored URL may have expired, so anything with a ref is re-minted.
   */
  async playableUrl(track: TrackEntity): Promise<string | null> {
    if (track.previewRef) {
      const ref = parseRef(track.previewRef);
      if (ref) {
        return (await this.previewLookup.mint(ref)) ?? track.previewUrl ?? null;
      }
    }

    return track.previewUrl ?? null;
  }
}
