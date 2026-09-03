'use client';

import type { GameHistoryEntryDto } from '@/sdk/models/GameHistoryEntryDto';
import type { GauntletHistoryEntryDto } from '@/sdk/models/GauntletHistoryEntryDto';
import type { GauntletHistorySummaryDto } from '@/sdk/models/GauntletHistorySummaryDto';
import type { StreakFreezeUsageDto } from '@/sdk/models/StreakFreezeUsageDto';
import { GameControllerGetHistoryStatusEnum as GameStatusFilter } from '@/sdk/apis/ApiApi';
import { useGameHistory, type PageSize } from '@/hooks/game/useGameHistory';
import {
  useGauntletHistory,
  type GauntletDifficultyFilter,
} from '@/hooks/speed-run/useSpeedRunHistory';
import type { HistoryTab, ModeDescriptor } from '@/components/history/modes';

export type StreakLostEntry = { from: string; to: string; gapDays: number };

export type TimelineEntry =
  | { type: 'game'; data: GameHistoryEntryDto }
  | { type: 'freeze'; data: StreakFreezeUsageDto }
  | { type: 'streak-lost'; data: StreakLostEntry }
  | { type: 'run'; data: GauntletHistoryEntryDto };

export interface ModeHistory {
  entries: TimelineEntry[];
  freezeUsages: StreakFreezeUsageDto[];
  totalItems: number;
  totalPages: number;
  runSummary?: GauntletHistorySummaryDto;
  isLoading: boolean;
  isPlaceholderData: boolean;
  error: unknown;
}

export interface ModeHistoryParams {
  page: number;
  pageSize: PageSize;
  search: string;
  status: GameStatusFilter[];
  difficulty?: GauntletDifficultyFilter;
  enabled: boolean;
}

/**
 * One history, whichever tab asked for it.
 *
 * Both queries are always mounted — a hook cannot be called conditionally —
 * and only the active one is enabled. Everything a tab differs by is resolved
 * here so the page reads the same fields no matter which mode it is showing.
 */
export function useModeHistory(
  mode: ModeDescriptor,
  params: ModeHistoryParams,
): ModeHistory {
  const { page, pageSize, search, status, difficulty, enabled } = params;
  const isRuns = mode.tab === 'gauntlet';

  const games = useGameHistory(
    {
      mode: mode.historyMode,
      page,
      pageSize,
      search: search || undefined,
      status,
    },
    enabled && !isRuns,
  );

  const runs = useGauntletHistory(
    { page, pageSize, difficulty },
    enabled && isRuns,
  );

  if (isRuns) {
    return {
      entries: (runs.data?.items ?? []).map((data) => ({
        type: 'run' as const,
        data,
      })),
      freezeUsages: [],
      totalItems: runs.data?.meta.totalItems ?? 0,
      totalPages: runs.data?.meta.totalPages ?? 0,
      runSummary: runs.data?.summary,
      isLoading: runs.isLoading,
      isPlaceholderData: runs.isPlaceholderData,
      error: runs.error,
    };
  }

  return {
    entries: (games.data?.items ?? []).map((data) => ({
      type: 'game' as const,
      data,
    })),
    freezeUsages: games.data?.streakFreezeUsages ?? [],
    totalItems: games.data?.meta.totalItems ?? 0,
    totalPages: games.data?.meta.totalPages ?? 0,
    isLoading: games.isLoading,
    isPlaceholderData: games.isPlaceholderData,
    error: games.error,
  };
}

export type {
  HistoryTab,
  PageSize,
  GameStatusFilter,
  GauntletDifficultyFilter,
};
