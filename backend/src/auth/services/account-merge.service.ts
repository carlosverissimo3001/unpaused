import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Transactional } from '@transaction/transactional.decorator';

@Injectable()
export class AccountMergeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Folds `sourceUserId` into `survivorUserId` and deletes the source. Nothing
   * the source carries may raise a privilege on the survivor.
   */
  @Transactional()
  async merge(sourceUserId: string, survivorUserId: string): Promise<void> {
    const [source, survivor] = await Promise.all([
      this.prismaService.user.findUniqueOrThrow({
        where: { id: sourceUserId },
      }),
      this.prismaService.user.findUniqueOrThrow({
        where: { id: survivorUserId },
      }),
    ]);

    await this.mergeStats(sourceUserId, survivorUserId);
    await this.mergeRoomPlayers(sourceUserId, survivorUserId);

    await this.prismaService.gameSession.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });
    await this.prismaService.gauntletRun.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });

    // Rooms cascade off their host, so an unclaimed room would vanish with the
    // source row rather than follow the player who made it.
    await this.prismaService.multiplayerRoom.updateMany({
      where: { hostId: sourceUserId },
      data: { hostId: survivorUserId },
    });

    await this.prismaService.user.update({
      where: { id: survivorUserId },
      data: {
        answeredQuestionIds: Array.from(
          new Set([
            ...survivor.answeredQuestionIds,
            ...source.answeredQuestionIds,
          ]),
        ),
      },
    });

    await this.prismaService.user.delete({ where: { id: sourceUserId } });
  }

  private async mergeStats(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const rows = await this.prismaService.stats.findMany({
      where: { userId: { in: [sourceUserId, survivorUserId] } },
    });

    const sourceRows = rows.filter((row) => row.userId === sourceUserId);

    for (const from of sourceRows) {
      const into = rows.find(
        (row) => row.userId === survivorUserId && row.mode === from.mode,
      );

      if (!into) {
        await this.prismaService.stats.create({
          data: { ...from, userId: survivorUserId },
        });
        continue;
      }

      await this.prismaService.stats.update({
        where: { userId_mode: { userId: survivorUserId, mode: from.mode } },
        data: {
          totalGames: into.totalGames + from.totalGames,
          totalWins: into.totalWins + from.totalWins,
          currentStreak: Math.max(into.currentStreak, from.currentStreak),
          bestStreak: Math.max(into.bestStreak, from.bestStreak),
          roundDistribution: into.roundDistribution.map(
            (value, index) => value + (from.roundDistribution[index] ?? 0),
          ),
          lastWinDate: laterOf(into.lastWinDate, from.lastWinDate),
        },
      });
    }

    // Stats do not cascade, so the source's rows must go before the row does.
    await this.prismaService.stats.deleteMany({
      where: { userId: sourceUserId },
    });
  }

  /** A player cannot be in a room twice: @@unique([roomId, userId]). */
  private async mergeRoomPlayers(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const [sourceRows, survivorRows] = await Promise.all([
      this.prismaService.roomPlayer.findMany({
        where: { userId: sourceUserId },
      }),
      this.prismaService.roomPlayer.findMany({
        where: { userId: survivorUserId },
      }),
    ]);

    const occupied = new Set(survivorRows.map((row) => row.roomId));

    for (const row of sourceRows) {
      if (occupied.has(row.roomId)) {
        await this.prismaService.roomPlayer.delete({ where: { id: row.id } });
        continue;
      }
      await this.prismaService.roomPlayer.update({
        where: { id: row.id },
        data: { userId: survivorUserId },
      });
    }
  }
}

function laterOf(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
