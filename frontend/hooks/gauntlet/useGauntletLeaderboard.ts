'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { GauntletControllerGetLeaderboardPeriodEnum } from '@/sdk/apis/ApiApi';

export type LeaderboardPeriod = GauntletControllerGetLeaderboardPeriodEnum;

export function useGauntletLeaderboard(
  period: LeaderboardPeriod,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.gauntlet.leaderboard(period),
    queryFn: () =>
      api.gauntletControllerGetLeaderboard({ period, limit: 50 }),
    enabled,
  });
}
