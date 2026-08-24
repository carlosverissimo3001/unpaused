'use client';

import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

/**
 * What an anonymous player sees where a mode they cannot enter would be. No
 * sign-up button: there is nothing to sign up to until CAR-188, and a CTA that
 * goes nowhere is worse than none.
 */
export function AccountRequiredNotice({ mode }: { mode: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-16 px-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-fg/5 border border-fg/10 text-fg/30">
        <Lock className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-fg">
          {mode} needs an account
        </h1>
        <p className="text-sm text-fg/50 tracking-tight max-w-xs">
          You can keep playing rounds without one — this mode just isn&apos;t
          open yet.
        </p>
      </div>

      <Link
        href="/game/guest?start=1"
        className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-spotify-green text-black text-sm font-black hover:brightness-110 active:scale-95 transition-all"
      >
        Play a round
      </Link>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-fg/40 hover:text-fg/70 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Link>
    </div>
  );
}
