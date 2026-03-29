import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  GauntletDifficulty,
  GauntletEndReason,
  GauntletRunStatus,
  Prisma,
} from '@prisma/client';
import { GauntletRunEntity } from '../entities/gauntlet-run.entity';
import { mapTrack } from '../../utils/mappers';

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
