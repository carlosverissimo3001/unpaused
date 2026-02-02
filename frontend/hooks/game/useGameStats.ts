"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";

export function useGameStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.game.stats,
    queryFn: () => api.gameControllerGetStats(),
    enabled: options?.enabled ?? true,
  });
}
