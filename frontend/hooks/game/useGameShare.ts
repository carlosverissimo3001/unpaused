'use client';

import { useQuery, queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';

export function gameShareQueryOptions(gameId: string) {
  return queryOptions({
    queryKey: queryKeys.game.share(gameId),
    queryFn: () => api.gameControllerGetShare({ id: gameId }),
    staleTime: Infinity,
    enabled: !!gameId,
  });
}

export function useGameShare(gameId: string) {
  return useQuery(gameShareQueryOptions(gameId));
}
