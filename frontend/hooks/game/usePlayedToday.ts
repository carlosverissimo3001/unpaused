"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";

export function usePlayedToday(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.game.playedToday,
    queryFn: () => api.gameControllerGetPlayedToday(),
    enabled: options?.enabled ?? true,
    refetchInterval: 60 * 1000, // Refetch every minute to keep up-to-date (important around midnight)
  });
}
