'use client';

import { FormEvent, useState } from 'react';
import { useRequestPasswordReset } from '@/hooks/auth/usePasswordReset';

/**
 * Reports the same thing however it went, because the endpoint does. Saying
 * "no account at that address" here would turn this form into a way to ask
 * which addresses are registered.
 */
export function ForgotPassword({
  initialEmail = '',
  onCancel,
}: {
  initialEmail?: string;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const { request, sent, pending, secondsLeft } = useRequestPasswordReset();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    request(email);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      {sent ? (
        <p className="rounded-xl border border-fg/10 bg-fg/5 px-3 py-2.5 text-[11px] leading-relaxed text-fg/60">
          If there is an account at {email} with a confirmed address, a link is
          on its way. Check your spam folder if it does not turn up.
        </p>
      ) : (
        <>
          <p className="px-1 text-[11px] leading-relaxed text-fg/45">
            We will send a link to choose a new password.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email"
            autoComplete="email"
            autoFocus
            required
            className="w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
          />
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !email || secondsLeft > 0}
          className="cursor-pointer rounded-full bg-spotify-green px-5 py-2 text-xs font-black text-black transition-opacity disabled:cursor-default disabled:opacity-50"
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
          onClick={onCancel}
          className="cursor-pointer text-[11px] text-fg/40 underline underline-offset-4 hover:text-fg/70"
        >
          Back to sign in
        </button>
      </div>
    </form>
  );
}
