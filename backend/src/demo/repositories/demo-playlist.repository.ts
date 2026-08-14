import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DemoPlaylist as PrismaDemoPlaylist } from '@prisma/client';
import { DemoPlaylistEntity } from '../entities/demo-playlist.entity';

@Injectable()
export class DemoPlaylistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DemoPlaylistEntity[]> {
    const rows = await this.prisma.demoPlaylist.findMany({
      orderBy: { slug: 'asc' },
    });
    return rows.map((row) => this.fromPrismaObject(row));
  }

  async upsert(
    slug: string,
    data: { name: string; imageUrl: string; description: string | null },
  ): Promise<void> {
    await this.prisma.demoPlaylist.upsert({
      where: { slug },
      create: { slug, ...data },
      update: { ...data, fetchedAt: new Date() },
    });
  }

  private fromPrismaObject(row: PrismaDemoPlaylist): DemoPlaylistEntity {
    return {
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl,
      description: row.description,
    };
  }
}
