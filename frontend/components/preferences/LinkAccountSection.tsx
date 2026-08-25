'use client';

import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Where a guest turns into an account holder. Spotify is the only credential
 * that exists today, and it is invite-capped, so when it is unavailable this
 * says so rather than offering a button that cannot work.
 */
export function LinkAccountSection({ canSignIn }: { canSignIn: boolean }) {
  return (
    <div className="rounded-2xl border border-spotify-green/25 bg-spotify-green/[0.06] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-xl bg-spotify-green/15 text-spotify-green">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight text-fg">
            Your progress lives on this device
          </p>
          <p className="mt-0.5 text-xs text-fg/60 leading-relaxed">
            Rounds, stats and streak are tied to this browser. Link Spotify to
            keep them anywhere you sign in — and to play your own playlists.
          </p>
        </div>
      </div>

      {canSignIn ? (
        <a href="/api/auth/login" className="block">
          <Button
            variant="spotify"
            className="!h-11 !rounded-full text-sm font-black w-full"
          >
            <Image
              src="/spotify-icon.svg"
              alt=""
              width={16}
              height={16}
              // The icon ships dark, and this button is already green.
              className="mr-2.5 shrink-0"
            />
            Link Spotify
          </Button>
        </a>
      ) : (
        <p className="text-xs text-fg/45 leading-relaxed">
          Signing up with a username and password is coming shortly. Spotify
          caps development apps at five users, so linking one is invite only.
        </p>
      )}
    </div>
  );
}
