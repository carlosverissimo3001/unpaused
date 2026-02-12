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
    queryKey: queryKeys.game.history({ mode: params?.mode, limit: PAGE_SIZE }),
    queryFn: ({ pageParam = 1 }) =>
      api.gameControllerGetHistory({
        mode: params?.mode,
        limit: PAGE_SIZE,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    enabled: params?.enabled ?? true,
  });
}
