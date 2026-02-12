'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { StreakQuestionDto } from '@/sdk';

export function useAdminStreakQuestions() {
  return useQuery<StreakQuestionDto[]>({
    queryKey: queryKeys.admin.streakQuestions,
    queryFn: () => api.adminControllerListStreakQuestions(),
  });
}
