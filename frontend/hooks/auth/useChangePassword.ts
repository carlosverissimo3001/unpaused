'use client';

import { useMutation } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';

export function useChangePassword() {
  return useMutation<void, Error, { current: string; next: string }>({
    mutationFn: async ({ current, next }) => {
      try {
        await api.authControllerChangePassword({
          changePasswordDto: { currentPassword: current, newPassword: next },
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
  });
}
