'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user-avatar/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message ?? 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Patch the cache immediately with the response — avoids a full refetch
      // delay and the grey flash it causes while useMe reloads.
      queryClient.setQueryData(queryKeys.auth.me, (old: Record<string, unknown> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          customAvatarUrl: data.customAvatarUrl,
          avatarSource: data.avatarSource,
          avatarUrl: data.avatarUrl,
        };
      });
    },
  });
}
