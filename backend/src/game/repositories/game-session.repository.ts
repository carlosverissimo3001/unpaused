import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { PrismaService } from '@prisma/prisma.service';
import {
  Prisma,
  GameSession,
  GameStatus,
  GameMode,
  Track,
} from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/client';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { GameSessionEntity } from '../entities/game-session.entity';
import { mapGuessesFromPrisma } from '../utils/guess-mapper';
import { FindGameSessionsDto } from '../dto/session/find-game-sessions.dto';
import { GAME_HISTORY_DEFAULT_PAGE_SIZE } from '../consts';

@Injectable()
export class GameSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new game session (optionally inside a transaction).
   * @param data - The game session data to create
   */
  async createSession(
    data: Prisma.GameSessionCreateInput,
  ): Promise<GameSessionEntity> {
    const createdSession = await this.prisma.gameSession.create({ data });
    return this.fromPrisma(createdSession);
  }

  async findMany(
    where: Prisma.GameSessionWhereInput,
  ): Promise<GameSessionEntity[]> {
    const sessions = await this.prisma.gameSession.findMany({ where });
    return sessions.map((s) => this.fromPrisma(s));
  }

  /**
   * Finds a game session by its ID
   * @param id - The ID of the game session
   * @returns The GameSession if found, null otherwise
   */
  async findById(id: string): Promise<GameSessionEntity | null> {
    const gameSession = await this.prisma.gameSession.findUnique({
      where: { id },
    });
    return gameSession ? this.fromPrisma(gameSession) : null;
  }

  /**
   * Finds a game session by ID with its track relation in a single query.
   */
  async findByIdWithTrack(
    id: string,
  ): Promise<{ game: GameSessionEntity; track: Track } | null> {
    const result = await this.prisma.gameSession.findUnique({
      where: { id },
      include: { track: true },
    });
    if (!result) {
      return null;
    }
    const { track, ...gameSession } = result;
    return { game: this.fromPrisma(gameSession), track };
  }

  /**
   * Updates the progress of a game session
   * @param id - The ID of the game session to update
   * @param updateData - The data to update (currentRound, guesses, status, completedAt)
   * @returns The updated GameSession
   */
  async updateSessionProgress(
    id: string,
    updateData: {
      currentRound: number;
      guesses: GuessHistoryDto[];
      status: GameStatus;
      completedAt?: Date;
    },
  ): Promise<GameSessionEntity> {
    const updatedSession = await this.prisma.gameSession.update({
      where: { id },
      data: {
        currentRound: updateData.currentRound,
        guesses: updateData.guesses as unknown as InputJsonValue,
        status: updateData.status,
        completedAt: updateData.completedAt ?? null,
      },
    });
    return this.fromPrisma(updatedSession);
  }

  async updateMany(
    where: Prisma.GameSessionWhereInput,
    updateData: Partial<Prisma.GameSessionUpdateInput>,
  ): Promise<number> {
    const result = await this.prisma.gameSession.updateMany({
      where,
      data: updateData,
    });
    return result.count;
  }

  /**
   * Finds today's daily game session for a user (isDaily true, createdAt >= startOfToday).
   */
  async findTodayDailySession(
    userId: string,
  ): Promise<GameSessionEntity | null> {
    const today = startOfDay(new Date());
    const session = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        mode: GameMode.DAILY,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });
    return session ? this.fromPrisma(session) : null;
  }

  /**
   * For a given user and mode, finds an active game session (status = PLAYING).
   * This is used to prevent starting multiple sessions at the same time.
   * @param userId - The ID of the user
   * @param mode - The game mode (e.g. DAILY, NORMAL)
   * @returns The active GameSession if found, null otherwise
   * */
  async findActiveSession(
    userId: string,
    mode: GameMode,
    playlistId?: string,
  ): Promise<GameSessionEntity | null> {
    const session = await this.prisma.gameSession.findFirst({
      where: { userId, mode, status: GameStatus.PLAYING, playlistId },
      orderBy: { createdAt: 'desc' },
    });
    return session ? this.fromPrisma(session) : null;
  }

  /**
   * Finds game sessions for a user with optional filters and pagination.
   */
  async findUserGameSessions(
    params: FindGameSessionsDto,
  ): Promise<{ items: GameSessionEntity[]; total: number }> {
    const {
      userId,
      mode,
      onlyCompleted,
      limit = GAME_HISTORY_DEFAULT_PAGE_SIZE,
      page = 1,
      search,
      status,
      from,
      to,
    } = params;

    const where: Prisma.GameSessionWhereInput = { userId };
    if (mode) {
      where.mode = mode;
    }
    if (status?.length) {
      where.status = { in: status };
    }
    if (onlyCompleted) {
      where.completedAt = { not: null };
    }

    // Date range filter on completedAt
    if (from || to) {
      where.completedAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    // Search across track name, artist name, and album name
    if (search) {
      where.track = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { artistName: { contains: search, mode: 'insensitive' } },
          { albumName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.gameSession.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.gameSession.count({ where }),
    ]);

    return {
      items: items.map((s) => this.fromPrisma(s)),
      total,
    };
  }

  async markAsAbandoned(id: string): Promise<GameSessionEntity> {
    const updatedSession = await this.prisma.gameSession.update({
      where: { id },
      data: {
        status: GameStatus.ABANDONED,
        completedAt: new Date(),
      },
    });
    return this.fromPrisma(updatedSession);
  }

  fromPrisma(prismaEntity: GameSession): GameSessionEntity {
    const score =
      prismaEntity.status === GameStatus.WON
        ? // Guessed on 6th round -> score = 1, guessed on 1st round -> score = 6
          6 - prismaEntity.currentRound + 1
        : prismaEntity.status === GameStatus.LOST
          ? 0
          : undefined;

    return {
      ...prismaEntity,
      userId: prismaEntity.userId ?? undefined,
      completedAt: prismaEntity.completedAt ?? undefined,
      guesses: mapGuessesFromPrisma(prismaEntity.guesses),
      score,
    };
  }
}
