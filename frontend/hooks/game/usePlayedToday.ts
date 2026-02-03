"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";

export function usePlayedToday(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.game.playedToday,
    queryFn: () => api.gameControllerGetPlayedToday(),
    enabled: options?.enabled ?? true,
  });
}
