'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/sdk/client';
import { RESEND_COOLDOWN_SECONDS } from '@/lib/consts';
import type { PasswordResetResultDto } from '@/sdk';

/**
 * Asks for a reset link. The server answers the same way for an address it
 * knows and one it does not, so this reports "sent" either way — anything else
 * on screen would be reporting whether that address has an account here.
 */
export function useRequestPasswordReset() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const mutation = useMutation({
    mutationFn: (email: string) =>
      api.authControllerRequestPasswordReset({
        requestPasswordResetDto: { email },
      }),
    onSettled: () => setSecondsLeft(RESEND_COOLDOWN_SECONDS),
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return {
    request: (email: string) => mutation.mutate(email),
    sent: mutation.isSuccess,
    pending: mutation.isPending,
    secondsLeft,
  };
}

export function useConfirmPasswordReset() {
  return useMutation<PasswordResetResultDto, Error, [string, string]>({
    mutationFn: ([token, password]) =>
      api.authControllerConfirmPasswordReset({
        confirmPasswordResetDto: { token, password },
      }),
  });
}
