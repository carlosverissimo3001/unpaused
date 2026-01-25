"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { GameStateDto, StartGameDto } from "@/sdk";

/**
 * Mutation hook to start a new game session
 * On success, invalidates and sets the game state query
 */
export function useStartGame() {
  const queryClient = useQueryClient();

  return useMutation<GameStateDto, Error, string>({
    mutationFn: async (playlistId: string) => {
      const startGameDto: StartGameDto = { playlistId };
      return api.gameControllerStartGame({ startGameDto });
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
