"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { TokenLoginDto } from "@/sdk";

interface TokenLoginParams {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Mutation hook for token-based login (dev only)
 * Invalidates auth queries on success to refetch user
 */
export function useTokenLogin() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, TokenLoginParams>({
    mutationFn: async ({ accessToken, refreshToken }) => {
      const tokenLoginDto: TokenLoginDto = { accessToken, refreshToken };
      return api.authControllerTokenLogin({ tokenLoginDto });
    },
    onSuccess: () => {
      // Invalidate auth queries to refetch user
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.all,
      });
    },
  });
}
