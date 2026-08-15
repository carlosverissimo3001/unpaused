'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/sdk/client';

/**
 * Mutation hook to logout. Sends the user home once the session is gone.
 */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      return api.authControllerLogout();
    },
    onSuccess: () => {
      // Hard, so pages that render without a user don't stay mounted.
      window.location.href = '/';
    },
  });
}
