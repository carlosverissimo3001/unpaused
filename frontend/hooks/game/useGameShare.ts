"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/sdk/client";
import type { ShareResultDto } from "@/sdk";

export function useGameShare() {
  return useMutation<ShareResultDto, Error, string>({
    mutationFn: (gameId: string) => api.gameControllerGetShare({ id: gameId }),
  });
}
