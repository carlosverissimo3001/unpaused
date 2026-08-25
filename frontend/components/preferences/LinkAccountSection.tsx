'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

/**
 * Where a guest turns into an account holder. Spotify is the only credential
 * that exists today, and it is invite-capped, so when it is unavailable this
 * says so rather than offering a button that cannot work.
 */
export function LinkAccountSection({ canSignIn }: { canSignIn: boolean }) {
  return (
    <>
      <div className="-mx-6 border-t border-fg/10" />

      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
        Account
      </p>

      <div className="py-2 space-y-3">
        <div>
          <p className="text-sm font-bold text-fg">
            You&apos;re playing without an account
          </p>
          <p className="mt-0.5 text-xs text-fg/50 leading-relaxed">
            Your rounds, stats and streak live on this device. Link Spotify to
            keep them anywhere you sign in — and to play your own playlists.
          </p>
        </div>

        {canSignIn ? (
          <a href="/api/auth/login" className="block">
            <Button
              variant="outline"
              className="!h-11 !rounded-full text-sm font-semibold w-full"
            >
              <Image
                src="/spotify-icon.svg"
                alt=""
                width={16}
                height={16}
                // The icon ships dark, which disappears against the page.
                className="mr-2.5 shrink-0 brightness-0 invert"
              />
              Link Spotify
            </Button>
          </a>
        ) : (
          <p className="text-xs text-fg/40 leading-relaxed">
            Spotify caps development apps at five users, so linking is invite
            only for now. Email sign-up is coming.
          </p>
        )}
      </div>
    </>
  );
}
