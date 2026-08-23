'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { GameStateDto } from '@/sdk';

/** Fetch guest game state for a given round ID. */
export function useGuestGameState(roundId: string | null | undefined) {
  return useQuery<GameStateDto>({
    queryKey: queryKeys.guest.state(roundId!),
    queryFn: async () => {
      if (!roundId) throw new Error('Round ID is required');
      return api.guestGameControllerGetGameState({ id: roundId });
    },
    enabled: !!roundId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}
