'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { ScoreboardDto } from '@/sdk';

export function useMultiplayerScoreboard(
  roomId: string | undefined,
  socketConnected = false,
) {
  return useQuery<ScoreboardDto>({
    queryKey: queryKeys.multiplayer.scoreboard(roomId!),
    queryFn: () => api.multiplayerControllerGetScoreboard({ id: roomId! }),
    enabled: !!roomId,
    /** Poll while waiting for other players to finish (skip if socket is connected) */
    refetchInterval: (query) => {
      if (socketConnected) return false;
      const isComplete = query.state.data?.isComplete;
      return isComplete ? false : 3000;
    },
  });
}
