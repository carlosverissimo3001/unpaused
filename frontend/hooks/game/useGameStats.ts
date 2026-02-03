"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import { GameStatsDtoModeEnum as GameMode } from "@sdk";

export function useGameStats( mode: GameMode, options?: { enabled?: boolean },) {
  return useQuery({
    queryKey: queryKeys.game.stats,
    queryFn: () => api.gameControllerGetStats({ getStatsDto: { mode } }),
    enabled: options?.enabled ?? true,
  });
}
