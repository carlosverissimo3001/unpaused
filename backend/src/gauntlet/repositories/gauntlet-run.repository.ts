import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  AvatarSource,
  GauntletDifficulty,
  GauntletEndReason,
  GauntletRunStatus,
  Prisma,
} from '@prisma/client';
import { GauntletRunEntity } from '../entities/gauntlet-run.entity';
import { mapTrack } from '../../utils/mappers';

export interface LeaderboardEntryRaw {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
}

type PrismaGauntletRunResult = Prisma.GauntletRunGetPayload<{
  include: { currentTrack: true };
}>;

function toUndefinedIfNull<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function fromPrisma(data: PrismaGauntletRunResult): GauntletRunEntity {
  return {
    id: data.id,
    userId: data.userId,
    score: data.score,
    status: data.status,
    difficulty: data.difficulty,
    endReason: toUndefinedIfNull(data.endReason),
    trackIds: data.trackIds,
    currentTrackId: toUndefinedIfNull(data.currentTrackId),
    currentTrack: data.currentTrack ? mapTrack(data.currentTrack) : undefined,
    createdAt: data.createdAt,
    completedAt: toUndefinedIfNull(data.completedAt),
  };
}

function fromPrismaBasic(
  data: Prisma.GauntletRunGetPayload<object>,
): GauntletRunEntity {
  return {
    id: data.id,
    userId: data.userId,
    score: data.score,
    status: data.status,
    difficulty: data.difficulty,
    endReason: toUndefinedIfNull(data.endReason),
    trackIds: data.trackIds,
    currentTrackId: toUndefinedIfNull(data.currentTrackId),
    createdAt: data.createdAt,
    completedAt: toUndefinedIfNull(data.completedAt),
  };
}

@Injectable()
export class GauntletRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    difficulty: GauntletDifficulty,
  ): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.create({
      data: {
        user: { connect: { id: userId } },
        score: 0,
        status: GauntletRunStatus.PLAYING,
        difficulty,
        trackIds: [],
      },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async findById(id: string): Promise<GauntletRunEntity | null> {
    const run = await this.prisma.gauntletRun.findUnique({
      where: { id },
      include: { currentTrack: true },
    });
    return run ? fromPrisma(run) : null;
  }

  async findActiveRun(userId: string): Promise<GauntletRunEntity | null> {
    const run = await this.prisma.gauntletRun.findFirst({
      where: { userId, status: GauntletRunStatus.PLAYING },
      orderBy: { createdAt: 'desc' },
      include: { currentTrack: true },
    });
    return run ? fromPrisma(run) : null;
  }

  async setCurrentTrack(
    runId: string,
    trackId: string,
    trackIds: string[],
  ): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.update({
      where: { id: runId },
      data: {
        currentTrack: { connect: { id: trackId } },
        trackIds,
      },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async incrementScore(runId: string): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.update({
      where: { id: runId },
      data: { score: { increment: 1 } },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async endRun(
    runId: string,
    reason: GauntletEndReason,
  ): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.update({
      where: { id: runId },
      data: {
        status: GauntletRunStatus.ENDED,
        endReason: reason,
        completedAt: new Date(),
      },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async findPersonalBest(userId: string): Promise<number> {
    const result = await this.prisma.gauntletRun.aggregate({
      where: { userId, status: GauntletRunStatus.ENDED },
      _max: { score: true },
    });
    return result._max.score ?? 0;
  }

  async findDailyBest(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const result = await this.prisma.gauntletRun.aggregate({
      where: {
        userId,
        status: GauntletRunStatus.ENDED,
        completedAt: { gte: startOfDay },
      },
      _max: { score: true },
    });
    return result._max.score ?? 0;
  }

  async findLeaderboardEntries(
    startDate: Date | null,
    limit: number,
    offset: number,
  ): Promise<LeaderboardEntryRaw[]> {
    const grouped = await this.prisma.gauntletRun.groupBy({
      by: ['userId'],
      where: {
        status: GauntletRunStatus.ENDED,
        ...(startDate && { completedAt: { gte: startDate } }),
      },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: limit,
      skip: offset,
    });

    if (!grouped.length) return [];

    const userIds = grouped.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        customAvatarUrl: true,
        avatarSource: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped.map((row) => {
      const user = userMap.get(row.userId);
      const effectiveAvatar =
        user?.avatarSource === AvatarSource.CUSTOM
          ? user.customAvatarUrl
          : user?.avatarUrl;
      return {
        userId: row.userId,
        displayName: user?.displayName ?? 'Unknown',
        avatarUrl: effectiveAvatar ?? null,
        score: row._max.score ?? 0,
      };
    });
  }

  async countUsersWithHigherScore(
    score: number,
    startDate: Date | null,
  ): Promise<number> {
    const rows = await this.prisma.gauntletRun.groupBy({
      by: ['userId'],
      where: {
        status: GauntletRunStatus.ENDED,
        ...(startDate && { completedAt: { gte: startDate } }),
      },
      _max: { score: true },
      having: { score: { _max: { gt: score } } },
    });
    return rows.length;
  }

  async findUserBestInPeriod(
    userId: string,
    startDate: Date | null,
  ): Promise<number | null> {
    const result = await this.prisma.gauntletRun.aggregate({
      where: {
        userId,
        status: GauntletRunStatus.ENDED,
        ...(startDate && { completedAt: { gte: startDate } }),
      },
      _max: { score: true },
    });
    return result._max.score;
  }

  async findTopRuns(
    userId: string,
    limit: number,
  ): Promise<GauntletRunEntity[]> {
    const runs = await this.prisma.gauntletRun.findMany({
      where: { userId, status: GauntletRunStatus.ENDED },
      orderBy: { score: 'desc' },
      take: limit,
    });
    return runs.map(fromPrismaBasic);
  }
}
