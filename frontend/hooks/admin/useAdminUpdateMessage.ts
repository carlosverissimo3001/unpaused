"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/sdk/client";
import type { UpdateMessageDto, MessageDto } from "@/sdk";

export interface UpdateMessageParams {
  id: string;
  dto: UpdateMessageDto;
}

/**
 * Update an existing message (admin only). Invalidates messages list on success.
 */
export function useAdminUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation<MessageDto, Error, UpdateMessageParams>({
    mutationFn: async ({ id, dto }: UpdateMessageParams) => {
      try {
        return await api.adminControllerUpdateMessage({
          id,
          updateMessageDto: dto,
        });
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
