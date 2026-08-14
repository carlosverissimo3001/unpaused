import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DemoTrack as PrismaDemoTrack } from '@prisma/client';
import { Transactional } from '@transaction/transactional.decorator';
import { DemoTrackEntity } from '../entities/demo-track.entity';
import { type DemoTrack } from '../demo.constants';

@Injectable()
export class DemoTrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlaylist(playlistSlug: string): Promise<DemoTrackEntity[]> {
    const rows = await this.prisma.demoTrack.findMany({
      where: { playlistSlug },
      orderBy: { position: 'asc' },
    });

    return rows.map((row) => this.fromPrismaObject(row));
  }

  async countByPlaylist(playlistSlug: string): Promise<number> {
    return this.prisma.demoTrack.count({ where: { playlistSlug } });
  }

  /**
   * Swaps a playlist's tracks. Charts reorder and drop entries, so replacing
   * beats upserting: no stale rows survive a refresh, and a failure rolls back
   * to yesterday's set rather than leaving a half-updated one.
   */
  @Transactional()
  async replacePlaylist(
    playlistSlug: string,
    tracks: DemoTrack[],
  ): Promise<number> {
    if (!tracks.length) {
      return 0;
    }

    await this.prisma.demoTrack.deleteMany({ where: { playlistSlug } });
    const { count } = await this.prisma.demoTrack.createMany({
      data: tracks.map((track, index) => ({
        ...track,
        playlistSlug,
        // Chart rank, so it reads the way the chart does: the top song is 1.
        position: index + 1,
      })),
      // Only absorbs a chart listing the same track twice; cross-playlist
      // collisions are legal now that the key is (playlistSlug, id).
      skipDuplicates: true,
    });

    return count;
  }

  private fromPrismaObject(row: PrismaDemoTrack): DemoTrackEntity {
    return {
      id: row.id,
      playlistSlug: row.playlistSlug,
      name: row.name,
      artistName: row.artistName,
      albumImageUrl: row.albumImageUrl,
      previewUrl: row.previewUrl,
      position: row.position,
      fetchedAt: row.fetchedAt,
    };
  }
}
