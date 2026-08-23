import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

export interface PoolCandidate {
  id: string;
  fame: number;
}

@Injectable()
export class PoolTrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every track that may be picked, with the weight used to choose between
   * them. Only two columns of a few thousand rows, so this is cheap enough to
   * read per round and lets the weighting live in code rather than in SQL.
   */
  async findCandidates(excludeIds: string[] = []): Promise<PoolCandidate[]> {
    return this.prisma.poolTrack.findMany({
      where: excludeIds.length > 0 ? { id: { notIn: excludeIds } } : undefined,
      select: { id: true, fame: true },
    });
  }

  async count(): Promise<number> {
    return this.prisma.poolTrack.count();
  }

  async stats(): Promise<{
    total: number;
    firstYear: number | null;
    lastYear: number | null;
    refreshedAt: Date | null;
  }> {
    const [total, years, refreshed] = await Promise.all([
      this.prisma.poolTrack.count(),
      this.prisma.poolTrack.aggregate({
        _min: { year: true },
        _max: { year: true },
      }),
      this.prisma.poolTrack.aggregate({ _max: { refreshedAt: true } }),
    ]);

    return {
      total,
      firstYear: years._min.year,
      lastYear: years._max.year,
      refreshedAt: refreshed._max.refreshedAt,
    };
  }
}
