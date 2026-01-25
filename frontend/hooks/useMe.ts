"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { AuthMeResponseDto } from "@/sdk";

/**
 * Fetch current authenticated user
 * User profile can stay fresh longer (5 minutes staleTime)
 */
export function useMe() {
  return useQuery<AuthMeResponseDto>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      return api.authControllerMe();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user profile doesn't change often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false, // Don't retry on 401/403
  });
}
