'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { EmailVerificationResultDto } from '@/sdk';

/** Spends the link from the email. */
export function useConfirmEmail() {
  const queryClient = useQueryClient();

  return useMutation<EmailVerificationResultDto, Error, string>({
    mutationFn: (token) =>
      api.authControllerConfirmEmail({ confirmEmailDto: { token } }),
    onSuccess: (result) => {
      if (result.verified) {
        // The row that just changed is the one this page is about to describe.
        void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
    },
  });
}
