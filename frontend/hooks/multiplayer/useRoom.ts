'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { RoomDto } from '@/sdk';

export function useRoom(roomId: string | undefined, socketConnected = false) {
  return useQuery<RoomDto>({
    queryKey: queryKeys.multiplayer.room(roomId!),
    queryFn: () => api.multiplayerControllerGetRoomState({ id: roomId! }),
    enabled: !!roomId,
    refetchInterval: (query) => {
      if (socketConnected) return false; // socket handles updates
      const status = query.state.data?.status;
      return status === 'WAITING' ? 2000 : false; // fallback polling
    },
  });
}
