'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { PlaylistDto } from '@/sdk';

/**
 * Fetch playlist by ID (metadata only; no tracks).
 * Used for breadcrumb, media session, and display on the game page.
 */
export function usePlaylistById(playlistId: string | null | undefined) {
  return useQuery<PlaylistDto>({
    queryKey: queryKeys.playlists.detail(playlistId!),
    queryFn: async () => {
      if (!playlistId) throw new Error('Playlist ID is required');
      return api.playlistControllerGetPlaylistById({
        id: playlistId,
      });
    },
    enabled: !!playlistId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
