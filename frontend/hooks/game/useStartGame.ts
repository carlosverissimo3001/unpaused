"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/sdk/client";
import type { GameStateDto, StartGameDto } from "@/sdk";

/**
 * Mutation hook to start a new game session (playlist or daily).
 * On success, invalidates and sets the game state query.
 */
export function useStartGame() {
  const queryClient = useQueryClient();

  return useMutation<GameStateDto, Error, StartGameDto>({
    mutationFn: async (params: StartGameDto) => {
      try {
        const startGameDto: StartGameDto = { playlistId: params.playlistId, isDaily: params.isDaily };
        return await api.gameControllerStartGame({ startGameDto });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      // Set the game state in cache immediately
      queryClient.setQueryData<GameStateDto>(
        queryKeys.game.state(data.sessionId),
        data
      );
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.game.session(data.sessionId),
      });
    },
  });
}
