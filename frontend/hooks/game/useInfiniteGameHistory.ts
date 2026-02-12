'use client';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

const PAGE_SIZE = 20;

export function useInfiniteGameHistory(params?: {
  mode: GameMode;
  enabled?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.game.history({ ...params, limit: PAGE_SIZE }),
    queryFn: ({ pageParam = 0 }) =>
      api.gameControllerGetHistory({
        mode: params?.mode,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
    enabled: params?.enabled ?? true,
  });
}
