'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { AuthMeResponseDto } from '@/sdk';

/**
 * Mints an identity for a visitor who has none, so they can land on the real
 * home page rather than the pitch for it. A deliberate click, never a page
 * load — a crawler must not create a user.
 */
export function useEnsureSession() {
  const queryClient = useQueryClient();

  return useMutation<AuthMeResponseDto>({
    mutationFn: () => api.authControllerEnsureSession(),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });
}
