"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { GameStateDto } from "@/sdk";

/**
 * Fetch game state for a given session ID
 * Game state should be stale immediately for real-time updates
 * Preserves trackOptions from cache since backend doesn't return them in getGameState
 */
export function useGameState(sessionId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useQuery<GameStateDto>({
    queryKey: queryKeys.game.state(sessionId!),
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID is required");
      const freshState = await api.gameControllerGetGameState({ id: sessionId });
      
      // Preserve trackOptions from cache (backend returns empty array)
      const cachedState = queryClient.getQueryData<GameStateDto>(
        queryKeys.game.state(sessionId)
      );
      
      if (cachedState?.trackOptions && cachedState.trackOptions.length > 0) {
        return {
          ...freshState,
          trackOptions: cachedState.trackOptions,
        };
      }
      
      return freshState;
    },
    enabled: !!sessionId,
    staleTime: 0, // Game state should be stale immediately
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
