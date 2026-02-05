import { GuessResult } from "../consts";
import { GuessHistoryDto } from "../dto/guess/guess-history.dto";
import { InputJsonValue } from "@prisma/client/runtime/client";

type PrismaGuessItem = {
    result: string;
    trackId?: string;
    trackName?: string;
    artistName?: string;
};

export function mapGuessesFromPrisma(prismaGuesses: InputJsonValue | null): GuessHistoryDto[] {
    if (prismaGuesses == null || !Array.isArray(prismaGuesses)) {
        return [];
    }
    return prismaGuesses.map((g: PrismaGuessItem) => ({
        result: g.result as GuessResult,
        trackId: g.trackId,
        trackName: g.trackName ?? "Unknown",
        artistName: g.artistName ?? "Unknown",
    }));
}