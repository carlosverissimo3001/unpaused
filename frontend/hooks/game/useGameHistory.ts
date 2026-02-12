'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';

export function useGameHistory(params?: {
  limit?: number;
  offset?: number;
  isDaily?: boolean;
  isCompleted?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.game.history(params),
    queryFn: () => api.gameControllerGetHistory(params ?? {}),
  });
}
