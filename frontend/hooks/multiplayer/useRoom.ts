'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto } from '@/sdk';

export function useRoom(roomId: string | undefined, socketConnected = false) {
  return useQuery<RoomDto>({
    queryKey: queryKeys.multiplayer.room(roomId!),
    // Unwrapped, or the page shows the SDK's "Response returned an error code"
    // in place of what the API actually said.
    queryFn: async () => {
      try {
        return await api.multiplayerControllerGetRoomState({ id: roomId! });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    // A room you are not in will not admit you on a retry.
    retry: false,
    enabled: !!roomId,
    refetchInterval: (query) => {
      if (socketConnected) return false; // socket handles updates
      const status = query.state.data?.status;
      return status === 'WAITING' ? 2000 : false; // fallback polling
    },
  });
}
