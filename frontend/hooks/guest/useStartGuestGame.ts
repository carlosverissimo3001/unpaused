'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { GameStateDto } from '@/sdk';

/** Mutation hook to start a new guest round from the curated pool. */
export function useStartGuestGame() {
  const queryClient = useQueryClient();

  return useMutation<GameStateDto, Error, void>({
    mutationFn: async () => {
      try {
        return await api.guestGameControllerStartGame();
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<GameStateDto>(
        queryKeys.guest.state(data.sessionId),
        data,
      );
    },
  });
}
