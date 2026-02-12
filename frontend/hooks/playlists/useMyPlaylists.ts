'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { PlaylistsResponseDto } from '@/sdk';

// TODO: Move to a consts
// Also, playlist don't change a lot, so we can have higher stale time and gc time
const THIRTY_MINUTES = 30 * 60 * 1000;

interface UseMyPlaylistsParams {
  limit?: number;
  offset?: number;
  onlyPublic?: boolean;
  onlyUserOwned?: boolean;
  enabled?: boolean;
}

/**
 * Fetch current user's playlists
 */
export function useMyPlaylists(params?: UseMyPlaylistsParams) {
  const { enabled = true, ...queryParams } = params || {};

  return useQuery<PlaylistsResponseDto>({
    queryKey: queryKeys.playlists.me(queryParams),
    queryFn: async () => {
      return api.playlistControllerGetMyPlaylists(queryParams);
    },
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
    enabled,
  });
}
