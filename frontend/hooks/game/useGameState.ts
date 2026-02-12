'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { GameStateDto } from '@/sdk';

/**
 * Fetch game state for a given session ID.
 */
export function useGameState(sessionId: string | null | undefined) {
  return useQuery<GameStateDto>({
    queryKey: queryKeys.game.state(sessionId!),
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      return api.gameControllerGetGameState({ id: sessionId });
    },
    enabled: !!sessionId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}
