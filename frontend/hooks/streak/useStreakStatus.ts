'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { StreakStatusDto } from '@/sdk';

export function useStreakStatus(opts?: { enabled?: boolean }) {
  return useQuery<StreakStatusDto>({
    queryKey: queryKeys.streak.status,
    queryFn: () => api.streakControllerGetStatus(),
    refetchOnWindowFocus: true,
    enabled: opts?.enabled ?? true,
  });
}
