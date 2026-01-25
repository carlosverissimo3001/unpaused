import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { Prisma, GameSession, GameStatus } from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/client";
import { GuessHistoryDto } from "../dto/game.dto";

@Injectable()
export class GameSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new game session
   * @param data - The game session data to create
   * @returns The created GameSession
   */
  async createSession(data: Prisma.GameSessionCreateInput): Promise<GameSession> {
    return await this.prisma.gameSession.create({
      data,
    });
  }

  /**
   * Finds a game session by its ID
   * @param id - The ID of the game session
   * @returns The GameSession if found, null otherwise
   */
  async findById(id: string): Promise<GameSession | null> {
    return await this.prisma.gameSession.findUnique({
      where: { id },
    });
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
  ): Promise<GameSession> {
    return await this.prisma.gameSession.update({
      where: { id },
      data: {
        currentRound: updateData.currentRound,
        guesses: updateData.guesses as unknown as InputJsonValue,
        status: updateData.status,
        completedAt: updateData.completedAt ?? null,
      },
    });
  }
}
