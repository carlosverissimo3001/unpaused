"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { PlaylistsResponseDto } from "@/sdk";

interface UseMyPlaylistsParams {
  limit?: number;
  offset?: number;
  includePrivate?: boolean;
  onlyUserOwned?: boolean;
}

/**
 * Fetch current user's playlists
 * Playlists can stay fresh for a bit (2 minutes staleTime)
 */
export function useMyPlaylists(params?: UseMyPlaylistsParams) {
  return useQuery<PlaylistsResponseDto>({
    queryKey: queryKeys.playlists.me(params),
    queryFn: async () => {
      return api.playlistControllerGetMyPlaylists(params || {});
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: true, // Always enabled - will return empty if not authenticated
  });
}
