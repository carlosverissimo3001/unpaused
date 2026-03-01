'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto } from '@/sdk';

export function useToggleReady() {
  const queryClient = useQueryClient();

  return useMutation<RoomDto, Error, string>({
    mutationFn: async (roomId) => {
      try {
        return await api.multiplayerControllerToggleReady({ id: roomId });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.multiplayer.room(data.id), data);
    },
  });
}
