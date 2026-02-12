'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

export const PAGE_SIZE = 3;

export function useGameHistory(params: {
  mode?: GameMode;
  page: number;
  enabled?: boolean;
}) {
  const offset = (params.page - 1) * PAGE_SIZE;
  return useQuery({
    queryKey: queryKeys.game.history({
      mode: params.mode,
      limit: PAGE_SIZE,
      offset,
    }),
    queryFn: () =>
      api.gameControllerGetHistory({
        mode: params.mode,
        limit: PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
    enabled: params.enabled ?? true,
  });
}
