'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto } from '@/sdk';

export function useKickPlayer() {
  const queryClient = useQueryClient();

  return useMutation<RoomDto, Error, { roomId: string; userId: string }>({
    mutationFn: async ({ roomId, userId }) => {
      try {
        return await api.multiplayerControllerKickPlayer({
          id: roomId,
          kickPlayerDto: { userId },
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.multiplayer.room(data.id), data);
    },
  });
}
