"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/sdk/client";
import type { CreateStreakQuestionDto, StreakQuestionDto } from "@/sdk";

export function useAdminCreateStreakQuestion() {
  const queryClient = useQueryClient();

  return useMutation<StreakQuestionDto, Error, CreateStreakQuestionDto>({
    mutationFn: async (dto) => {
      try {
        return await api.adminControllerCreateStreakQuestion({ createStreakQuestionDto: dto });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.streakQuestions });
    },
  });
}
