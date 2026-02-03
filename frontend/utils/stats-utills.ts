import { GameHistoryEntryDto, GameHistoryEntryDtoStatusEnum } from "@/sdk/models/GameHistoryEntryDto";

export function computeStreak(items: GameHistoryEntryDto[]): number {
    const dailyByDateDesc = [...items]
      .filter((e) => e.isDaily)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
    let streak = 0;
    for (const e of dailyByDateDesc) {
      if (e.status !== GameHistoryEntryDtoStatusEnum.Won) break;
      streak++;
    }
    return streak;
  }