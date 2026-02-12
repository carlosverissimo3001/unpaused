"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/sdk/client";

export function useAdminDeleteStreakQuestion() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        return await api.adminControllerDeleteStreakQuestion({ id });
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
