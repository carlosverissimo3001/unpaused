"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/sdk/client";
import type { DailyControllerGetShareRequest, ShareResultDto } from "@/sdk";

export function useDailyShare() {
  return useMutation<ShareResultDto | null, Error, DailyControllerGetShareRequest>({
    mutationFn: async (request) => {
      const result = await api.dailyControllerGetShare(request);
      if (!result) throw new Error("Failed to get share");
      return result;
    },
  });
}
