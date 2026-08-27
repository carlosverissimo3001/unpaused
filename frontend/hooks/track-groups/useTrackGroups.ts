'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { TrackGroupDtoTypeEnum } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';

/**
 * The curated sets anyone can play. Unlike playlists this needs no account, so
 * it is never gated on one.
 */
export function useTrackGroups(
  type: TrackGroupDtoTypeEnum = TrackGroupDtoTypeEnum.Decade,
) {
  return useQuery<TrackGroupDto[]>({
    queryKey: queryKeys.trackGroups.byType(type),
    queryFn: () => api.trackGroupControllerList({ type }),
    // Six rows that change when the pool is reseeded, which is not often.
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * One group by the name in its URL, so a shared link resolves without knowing
 * which kind of group it is.
 */
export function useTrackGroupBySlug(slug: string) {
  return useQuery<TrackGroupDto>({
    queryKey: queryKeys.trackGroups.bySlug(slug),
    queryFn: () => api.trackGroupControllerBySlug({ slug }),
    enabled: !!slug,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
}
