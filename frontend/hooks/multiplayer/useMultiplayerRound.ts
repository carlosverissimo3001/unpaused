'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { MultiplayerRoundStateDto } from '@/sdk';
import { MultiplayerRoundStateDtoStatusEnum } from '@/sdk';

export function useMultiplayerRound(roomId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<MultiplayerRoundStateDto>({
    queryKey: queryKeys.multiplayer.round(roomId!),
    queryFn: () => api.multiplayerControllerGetRoundState({ id: roomId! }),
    enabled: !!roomId,
    /**
     * Only poll when the round is complete — waiting for other players
     * or room-level state changes. During active play the player drives
     * state via guess submissions which invalidate the cache directly.
     */
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return false;
      return status !== MultiplayerRoundStateDtoStatusEnum.Playing
        ? 3000
        : false;
    },
  });

  const advanceRound = useCallback(() => {
    if (!roomId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.multiplayer.round(roomId),
    });
  }, [roomId, queryClient]);

  return { ...query, advanceRound };
}
