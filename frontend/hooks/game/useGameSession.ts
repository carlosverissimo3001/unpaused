"use client";

import { useEffect } from "react";
import { useStartGame } from "./useStartGame";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";

/**
 * Handles game session initialization: starts playlist or daily game once on mount.
 * Session ID comes directly from the mutation result.
 */
export function useGameSession(mode: GameMode, playlistId?: string) {
  const startGameMutation = useStartGame();
  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;
  const shouldStart = (isPlaylist && !!playlistId) || isDaily;

  useEffect(() => {
    if (!shouldStart) return;
    if (startGameMutation.data) return;
    if (startGameMutation.isPending) return;

    startGameMutation.mutate(
      isPlaylist && playlistId ? { playlistId } : { isDaily: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionId = startGameMutation.data?.sessionId ?? undefined;
  const isLoading = shouldStart && (sessionId == null || startGameMutation.isPending);
  const error = startGameMutation.error;

  return {
    sessionId,
    isLoading,
    error: error ?? null,
    startGameMutation,
  };
}
