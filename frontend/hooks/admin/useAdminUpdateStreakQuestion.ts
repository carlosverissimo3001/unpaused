'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { UpdateStreakQuestionDto, StreakQuestionDto } from '@/sdk';

export function useAdminUpdateStreakQuestion() {
  const queryClient = useQueryClient();

  return useMutation<
    StreakQuestionDto,
    Error,
    { id: string; dto: UpdateStreakQuestionDto }
  >({
    mutationFn: async ({ id, dto }) => {
      try {
        return await api.adminControllerUpdateStreakQuestion({
          id,
          updateStreakQuestionDto: dto,
        });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.streakQuestions,
      });
    },
  });
}
