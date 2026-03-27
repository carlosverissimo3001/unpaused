'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function useUpdateAvatarSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: 'SPOTIFY' | 'CUSTOM') => {
      const response = await fetch('/api/user-avatar/source', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message ?? 'Failed to update avatar source');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, (old: Record<string, unknown> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          avatarSource: data.avatarSource,
          avatarUrl: data.avatarUrl,
          customAvatarUrl: data.customAvatarUrl,
        };
      });
    },
  });
}
