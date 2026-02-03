import { GameMode, Stats } from "@prisma/client";
import { UpdateStatsDto } from "../dto/update-stats.dto";
import { PrismaService } from "@prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { GameStatsEntity } from "../entities/game-stats.entity";

@Injectable()
export class GameStatsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUserId(userId: string, mode: GameMode): Promise<GameStatsEntity> {
        const stats = await this.prisma.stats.findUniqueOrThrow({ where: { userId, mode } });
        return this.fromPrisma(stats);
    }

    async upsert(userId: string, mode: GameMode): Promise<GameStatsEntity> {
        const stats = await this.prisma.stats.upsert({
            where: { userId },
            create: { userId, mode },
            update: {},
        });
        return this.fromPrisma(stats);
    }

    async update(userId: string, params: UpdateStatsDto, mode: GameMode): Promise<GameStatsEntity> {
        const stats = await this.prisma.stats.update({
            where: { userId, mode },
            data: this.mapUpdateData(params),
        });
        return this.fromPrisma(stats);
    }

    private mapUpdateData(params: UpdateStatsDto) {
        const { currentStreak, bestStreak, scoreDistribution, won, score } = params;
        return {
            currentStreak,
            bestStreak,
            scoreDistribution,
            totalGames: { increment: 1 },
            totalWins: won ? { increment: 1 } : undefined,
            totalScore: { increment: score },
        };
    }

    fromPrisma(prisma: Stats): GameStatsEntity {
        return {
            ...prisma,
        };
    }
}