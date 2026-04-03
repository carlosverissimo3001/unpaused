'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { GauntletControllerGetHistoryDifficultyEnum } from '@/sdk/apis/ApiApi';

export type { GauntletControllerGetHistoryDifficultyEnum as GauntletDifficultyFilter } from '@/sdk/apis/ApiApi';

export interface GauntletHistoryFilters {
  page: number;
  pageSize: number;
  difficulty?: GauntletControllerGetHistoryDifficultyEnum;
}

export function useGauntletHistory(
  filters: GauntletHistoryFilters,
  enabled = true,
) {
  const { page, pageSize, difficulty } = filters;

  return useQuery({
    queryKey: queryKeys.gauntlet.history({
      page,
      limit: pageSize,
      difficulty,
    }),
    queryFn: () =>
      api.gauntletControllerGetHistory({
        page,
        limit: pageSize,
        difficulty,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
