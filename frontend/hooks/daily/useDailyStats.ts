"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { DailyStatsDto } from "@/sdk";

export function useDailyStats(options?: { enabled?: boolean }) {
  return useQuery<DailyStatsDto | null>({
    queryKey: queryKeys.daily.stats,
    queryFn: async () => {
      const result = await api.dailyControllerGetStats();
      if (!result) throw new Error("Failed to get daily stats");
      return result;
    },
    enabled: options?.enabled ?? true,
  });
}
