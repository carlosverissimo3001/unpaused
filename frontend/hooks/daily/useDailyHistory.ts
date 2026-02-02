"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { DailyHistoryDto } from "@/sdk";

export function useDailyHistory(limit = 30, offset = 0) {
  return useQuery<DailyHistoryDto | null>({
    queryKey: queryKeys.daily.history({ limit, offset }),
    queryFn: () => api.dailyControllerGetHistory({ limit, offset }),
  });
}
