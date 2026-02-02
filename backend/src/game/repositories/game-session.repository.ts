import { Injectable } from "@nestjs/common";
import { startOfDay } from "date-fns";
import { PrismaService } from "@prisma/prisma.service";
import { Prisma, GameSession, GameStatus } from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/client";
import { GuessHistoryDto } from "../dto/guess-history.dto";
import { GameSessionEntity } from "../entities/game-session.entity";
import { mapGuessesFromPrisma } from "../utils/guess-mapper";
import { FindGameSessionsDto } from "../dto/find-game-sessions.dto";

@Injectable()
export class GameSessionRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Creates a new game session
   * @param data - The game session data to create
   * @returns The created GameSession
   */
  async createSession(data: Prisma.GameSessionCreateInput): Promise<GameSessionEntity> {
    const createdSession = await this.prisma.gameSession.create({
      data,
    });
    return this.fromPrisma(createdSession);
  }

  /**
   * Finds a game session by its ID
   * @param id - The ID of the game session
   * @returns The GameSession if found, null otherwise
   */
  async findById(id: string): Promise<GameSessionEntity | null> {
    const gameSession = await this.prisma.gameSession.findUnique({
      where: { id },
      include: { track: true },
    });
    return gameSession ? this.fromPrisma(gameSession) : null;
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

  /**
   * Finds today's daily game session for a user (isDaily true, createdAt >= startOfToday).
   */
  async findTodayDailySession(userId: string): Promise<GameSessionEntity | null> {
    const today = startOfDay(new Date());
    const session = await this.prisma.gameSession.findFirst({
      where: { userId, isDaily: true, createdAt: { gte: today } },
      orderBy: { createdAt: "desc" },
    });
    return session ? this.fromPrisma(session) : null;
  }

  /**
   * Finds game sessions for a user with optional filters and pagination.
   * @param userId - The ID of the user
   * @param options - isDaily?, isCompleted? (completedAt != null), limit?, offset?
   * @returns { items, total }
   */
  async findUserGameSessions(
    params: FindGameSessionsDto
  ): Promise<{ items: GameSessionEntity[]; total: number }> {
    const { userId, isDaily, onlyCompleted, limit, offset } = params;
    
    const where: Prisma.GameSessionWhereInput = { userId };
    if (isDaily) {
      where.isDaily = true;
    }
    if (onlyCompleted) {
      where.completedAt = { not: null };
    }

    const [items, total] = await Promise.all([
      this.prisma.gameSession.findMany({
        where,
        orderBy: { completedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.gameSession.count({ where }),
    ]);

    return {
      items: items.map((s) => this.fromPrisma(s)),
      total,
    };
  }

  fromPrisma(prismaEntity: GameSession): GameSessionEntity {
    const score =
      prismaEntity.status === GameStatus.WON
        ? 6 - prismaEntity.currentRound
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
