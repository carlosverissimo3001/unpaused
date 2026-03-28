'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { AuthMeResponseDto } from '@/sdk';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string): Promise<AuthMeResponseDto> => {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });
}
