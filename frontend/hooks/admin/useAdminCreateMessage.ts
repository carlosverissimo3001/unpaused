"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/sdk/client";
import type { CreateMessageDto, MessageDto } from "@/sdk";

/**
 * Create a new message (admin only). Invalidates messages list on success.
 */
export function useAdminCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation<MessageDto, Error, CreateMessageDto>({
    mutationFn: async (dto: CreateMessageDto) => {
      try {
        return await api.adminControllerCreateMessage({ createMessageDto: dto });
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
