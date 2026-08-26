import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class DailyTrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTrackIdForDay(day: Date): Promise<string | null> {
    const row = await this.prisma.dailyTrack.findUnique({
      where: { date: day },
      select: { trackId: true },
    });
    return row?.trackId ?? null;
  }

  /** What a new pick has to avoid, so a song does not come round twice quickly. */
  async trackIdsSince(day: Date): Promise<string[]> {
    const rows = await this.prisma.dailyTrack.findMany({
      where: { date: { gte: day } },
      select: { trackId: true },
    });
    return rows.map((row) => row.trackId);
  }

  /**
   * Whoever gets there first sets the day. `date` is the primary key, so a
   * second writer is skipped rather than rejected, and both end up reading the
   * same answer.
   */
  async claimDay(day: Date, trackId: string): Promise<void> {
    await this.prisma.dailyTrack.createMany({
      data: [{ date: day, trackId }],
      skipDuplicates: true,
    });
  }
}
