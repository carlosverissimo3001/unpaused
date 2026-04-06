'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/sdk/client';
import { queryKeys } from '@/lib/queryKeys';

export function usePersonalBest(enabled = true) {
  return useQuery({
    queryKey: queryKeys.gauntlet.personalBest,
    queryFn: () => api.gauntletControllerGetPersonalBest(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
