"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { DailyTodayDto } from "@/sdk";
import { api } from "@/sdk/client";

export function useDailyToday(options?: { enabled?: boolean }) {
  return useQuery<DailyTodayDto | null>({
    queryKey: queryKeys.daily.today,
    queryFn: async () => {
      const result = await api.dailyControllerGetToday();
      if (!result) throw new Error("Failed to get today's daily");
      return result;
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("403")) return false;
      return failureCount < 2;
    },
  });
}
