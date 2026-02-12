'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { AuthMeResponseDto } from '@/sdk';

/**
 * Fetch current authenticated user
 * User profile can stay fresh longer (5 minutes staleTime)
 */
export function useMe() {
  return useQuery<AuthMeResponseDto | null>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        const response = await api.authControllerMe();
        return response ?? null;
      } catch (error: unknown) {
        // If unauthorized, return null instead of throwing
        if (
          (error as { status?: number })?.status === 401 ||
          (error as { status?: number })?.status === 403
        ) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user profile doesn't change often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false, // Don't retry on 401/403
  });
}
