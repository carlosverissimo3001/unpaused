"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/sdk/client";

/**
 * Delete a message (admin only). Invalidates messages list on success.
 */
export function useAdminDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      try {
        await api.adminControllerDeleteMessage({ id });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.messages });
    },
  });
}
