"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { PlaylistDto } from "@/sdk";

/**
 * Fetch playlist by ID
 * Playlist details can stay fresh for a bit (1 minute staleTime)
 */
export function usePlaylistById(playlistId: string | null | undefined) {
  return useQuery<PlaylistDto>({
    queryKey: queryKeys.playlists.detail(playlistId!),
    queryFn: async () => {
      if (!playlistId) throw new Error("Playlist ID is required");
      return api.playlistsControllerGetPlaylistById({ id: playlistId });
    },
    enabled: !!playlistId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
