"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { QuizNextResponseDto } from "@/sdk";

export function useStreakQuizNext(opts?: { enabled?: boolean }) {
  return useQuery<QuizNextResponseDto>({
    queryKey: queryKeys.streak.quiz,
    queryFn: () => api.streakControllerGetNextQuestion(),
    enabled: opts?.enabled ?? true,
    staleTime: Infinity,
  });
}
