'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';

export function useLeaveRoom() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (roomId) => {
      try {
        await api.multiplayerControllerLeaveRoom({ id: roomId });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (_, roomId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.multiplayer.room(roomId),
      });
    },
  });
}
