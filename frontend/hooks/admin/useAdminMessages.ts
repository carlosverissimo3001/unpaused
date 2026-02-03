"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { MessageDto } from "@/sdk";

/**
 * Fetch all messages (admin only). Use only when user is confirmed admin.
 */
export function useAdminMessages() {
  return useQuery<MessageDto[]>({
    queryKey: queryKeys.admin.messages,
    queryFn: async () => {
      return api.adminControllerGetAllMessages();
    },
  });
}
