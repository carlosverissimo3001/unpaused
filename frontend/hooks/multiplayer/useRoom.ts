'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { RoomDto } from '@/sdk';

export function useRoom(roomId: string | undefined) {
  return useQuery<RoomDto>({
    queryKey: queryKeys.multiplayer.room(roomId!),
    queryFn: () => api.multiplayerControllerGetRoomState({ id: roomId! }),
    enabled: !!roomId,
    // TODO: At some point, we'd like to have websockets for this, but for now,
    // we'll just poll the server every 5 seconds if the room is still waiting for players.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'WAITING' ? 5000 : false;
    },
  });
}
