"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useStartGame } from "./useStartGame";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";

/**
 * Handles game session initialization: starts playlist or daily game once on mount.
 *
 * SessionId is derived from two sources:
 *  1. mutation.data — set when the mutation observer receives the result (same mount).
 *  2. A useQuery subscription on a predictable cache key — the config-level onSuccess
 *     in useStartGame writes here, and the subscription triggers a re-render even if
 *     the mutation observer is orphaned by Strict Mode.
 */
export function useGameSession(mode: GameMode, playlistId?: string) {
  const startGameMutation = useStartGame();
  const hasStarted = useRef(false);

  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;
  const shouldStart = (isPlaylist && !!playlistId) || isDaily;

  // Predictable cache key — known before the mutation completes
  const sessionCacheKey = isPlaylist && playlistId
    ? queryKeys.game.startedSessionForPlaylist(playlistId)
    : queryKeys.game.startedSessionForDaily;

  // Subscribe to the cache key. `enabled: false` → never fetches, but the
  // observer still re-renders when setQueryData writes to this key.
  const { data: cachedSessionId } = useQuery<string>({
    queryKey: sessionCacheKey,
    queryFn: () => Promise.reject(new Error("cache-only")),
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    if (!shouldStart || hasStarted.current) return;
    hasStarted.current = true;

    startGameMutation.mutate(
      isPlaylist && playlistId ? { playlistId, mode } : { mode }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStart]);

  const sessionId = startGameMutation.data?.sessionId ?? cachedSessionId ?? undefined;
  const isLoading = shouldStart && !sessionId;
  const error = startGameMutation.error;

  return {
    sessionId,
    isLoading,
    error: error ?? null,
    startGameMutation,
  };
}
