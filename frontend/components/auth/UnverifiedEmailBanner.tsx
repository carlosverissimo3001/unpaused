'use client';

import { useState } from 'react';
import { useMe } from '@/hooks/auth/useMe';
import { useResendVerification } from '@/hooks/auth/useResendVerification';

/**
 * Being unverified costs one thing: no password reset. So this asks rather
 * than blocks, and can be dismissed — a player who wants to keep playing
 * without confirming an address is not doing anything wrong.
 */
export function UnverifiedEmailBanner() {
  const { data: user } = useMe();
  const [dismissed, setDismissed] = useState(false);
  const { resend, sent, pending, secondsLeft } = useResendVerification();

  if (dismissed || !user?.email || user.emailVerified) return null;

  return (
    <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] leading-relaxed text-amber-200/80">
        {sent
          ? `Link sent to ${user.email}. Check your spam folder if it does not turn up.`
          : 'Confirm your email so you can reset your password if you ever forget it.'}
      </p>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={pending || secondsLeft > 0}
          className="cursor-pointer rounded-full border border-amber-400/30 px-4 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-400/10 disabled:cursor-default disabled:opacity-50"
        >
          {secondsLeft > 0
            ? `Resend in ${secondsLeft}s`
            : pending
              ? 'Sending…'
              : sent
                ? 'Send again'
                : 'Send the link'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="cursor-pointer text-xs text-amber-200/40 hover:text-amber-200/70"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
