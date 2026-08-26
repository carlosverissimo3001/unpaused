'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/sdk/client';
import { RESEND_COOLDOWN_SECONDS } from '@/lib/consts';

/**
 * Asks for the link again, and runs the countdown from when the request left
 * this browser rather than from anything the server says back.
 *
 * The server's answer is deliberately the same whether or not a mail went out
 * — telling the caller "too soon" would say that this address has an account
 * here, which is the one thing these endpoints are built not to say.
 */
export function useResendVerification() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const mutation = useMutation({
    mutationFn: () => api.authControllerResendVerification(),
    onSettled: () => setSecondsLeft(RESEND_COOLDOWN_SECONDS),
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return {
    resend: () => mutation.mutate(),
    sent: mutation.isSuccess,
    pending: mutation.isPending,
    secondsLeft,
  };
}
