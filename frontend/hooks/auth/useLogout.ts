"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";

/**
 * Mutation hook to logout
 * Invalidates all auth and user-related queries on success
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return api.authControllerLogout();
    },
    onSuccess: () => {
      // Invalidate all auth queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.all,
      });
      // Invalidate playlists (user-specific)
      queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.all,
      });
      // Clear all queries
      queryClient.clear();
    },
  });
}
