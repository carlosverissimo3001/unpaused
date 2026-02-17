'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';
import { GameControllerGetHistoryStatusEnum as GameStatusFilter } from '@/sdk/apis/ApiApi';

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 5;

export interface HistoryFilters {
  mode?: GameMode;
  page: number;
  pageSize: PageSize;
  search?: string;
  status?: GameStatusFilter[];
  from?: string;
  to?: string;
}

export function useGameHistory(filters: HistoryFilters, enabled = true) {
  const { mode, page, pageSize, search, status, from, to } = filters;

  return useQuery({
    queryKey: queryKeys.game.history({
      mode,
      page,
      limit: pageSize,
      search: search || undefined,
      status: status && status.length > 0 ? status : undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    queryFn: () =>
      api.gameControllerGetHistory({
        mode,
        page,
        limit: pageSize,
        search: search || undefined,
        status: status.length ? status : undefined,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
