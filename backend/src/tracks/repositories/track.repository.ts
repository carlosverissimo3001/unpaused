import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { Prisma, Track } from "@prisma/client";

@Injectable()
export class TrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a track by its ID
   * @param id - The ID of the track
   * @returns The Track if found, null otherwise
   */
  async findById(id: string): Promise<Track | null> {
    return await this.prisma.track.findUnique({
      where: { id },
    });
  }

  /**
   * Upserts a track (creates if it doesn't exist, updates if it does)
   * Automatically updates lastScrapedAt when the track is updated
   * @param id - The ID of the track
   * @param data - The partial track data to upsert
   * @returns The upserted Track
   */
  async upsertTrack(id: string, data: Partial<Track>): Promise<Track> {
    return await this.prisma.track.upsert({
      where: { id },
      update: {
        ...data,
        lastScrapedAt: new Date(),
      },
      create: {
        id,
        name: data.name ?? "",
        artistName: data.artistName ?? "",
        albumImageUrl: data.albumImageUrl ?? null,
        previewUrl: data.previewUrl ?? null,
        lastScrapedAt: new Date(),
      },
    });
  }
}
