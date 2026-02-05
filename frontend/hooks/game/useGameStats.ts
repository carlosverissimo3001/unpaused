"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import { GameStatsDtoModeEnum as GameMode } from "@sdk";

type UseGameStatsOptions = {
  mode: GameMode;
  // Whether to use the cached data or force a new fetch
  useCached?: boolean;
  enabled?: boolean;
};

export function useGameStats(params: UseGameStatsOptions) {
  const { mode, useCached, enabled } = params;
  return useQuery({
    queryKey: [...queryKeys.game.stats, mode],
    queryFn: () => api.gameControllerGetStats({ mode }),
    placeholderData: useCached ? keepPreviousData : undefined,
    enabled: enabled ?? true,
  });
}
