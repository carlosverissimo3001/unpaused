'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto, SetTrackSourceDtoTrackSourceEnum } from '@/sdk';

export function useSetTrackSource() {
  const queryClient = useQueryClient();

  return useMutation<
    RoomDto,
    Error,
    { roomId: string; trackSource: SetTrackSourceDtoTrackSourceEnum }
  >({
    mutationFn: async ({ roomId, trackSource }) => {
      try {
        return await api.multiplayerControllerSetTrackSource({
          id: roomId,
          setTrackSourceDto: { trackSource },
        });
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
