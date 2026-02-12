'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { StreakStatusDto } from '@/sdk';

export function useStreakFreeze() {
  const queryClient = useQueryClient();

  return useMutation<StreakStatusDto, Error>({
    mutationFn: async () => {
      try {
        return await api.streakControllerUseFreeze();
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.streak.status, data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.stats });
      void queryClient.invalidateQueries({ queryKey: ['game', 'history'] });
    },
  });
}
