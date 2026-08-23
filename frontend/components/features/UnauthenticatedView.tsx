'use client';

import { memo, useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSiteUnlock } from '@/hooks/auth/useSiteUnlock';

function InviteForm() {
  const [secret, setSecret] = useState('');
  const { unlock, error, pending, clearError } = useSiteUnlock();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // The cookie is read on the server, so only a refresh re-enables the button.
    if (await unlock(secret)) router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3"
    >
      <p className="text-xs text-fg/40 leading-relaxed">
        Spotify caps development apps at 5 users, so playing with your own
        library is invite only for now.
      </p>
      <div className="flex w-full min-w-0 gap-2">
        <input
          type="password"
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            clearError();
          }}
          placeholder="Secret word"
          aria-label="Secret word"
          autoComplete="off"
          disabled={pending}
          className="min-w-0 flex-1 rounded-full border border-fg/20 bg-fg/10 px-5 py-3 text-sm text-fg placeholder:text-fg/40 focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        <Button
          type="submit"
          variant="spotify"
          disabled={pending || !secret}
          className="!rounded-full px-6 shrink-0"
        >
          {pending ? '…' : 'Unlock'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-400">That is not the secret word.</p>
      )}
    </form>
  );
}

/**
 * Kept as a real button, not a quiet link: the handful of whitelisted users
 * come here specifically to play their own library, and should not have to
 * hunt for it — or worse, land in guest mode by mistake.
 */
function SpotifyButton({ canSignIn }: { canSignIn: boolean }) {
  const inner = (
    <Button
      variant="outline"
      disabled={!canSignIn}
      className="!h-12 sm:!h-14 !rounded-full text-base font-semibold w-full"
    >
      <Image
        src="/spotify-icon.svg"
        alt=""
        width={18}
        height={18}
        // The icon ships dark, which disappears against the page.
        className="mr-2.5 shrink-0 brightness-0 invert"
      />
      Sign in with Spotify
    </Button>
  );

  return canSignIn ? (
    <a href="/api/auth/login" className="w-full">
      {inner}
    </a>
  ) : (
    <div className="w-full">{inner}</div>
  );
}

function UnauthenticatedViewComponent({ canSignIn }: { canSignIn: boolean }) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[80vh] overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center flex flex-col gap-8 sm:gap-12 max-w-2xl px-6"
      >
        <div className="flex flex-col gap-4 sm:gap-6">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-fg leading-[0.9]">
            Song guessing,
            <br />
            <span className="text-spotify-green drop-shadow-[0_0_40px_rgba(30,215,96,0.35)]">
              reimagined.
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-fg/50 max-w-[280px] sm:max-w-md mx-auto leading-relaxed font-medium">
            Hear a snippet. Name the song. Six tries.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Equal columns, each caption owned by its own button, so the two
              paths read as a deliberate choice rather than a primary and a
              stray. The caption is what stops a whitelisted user landing in
              guest mode by mistake. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-md">
            <div className="flex flex-col items-center gap-2">
              <Link href="/game/guest" className="relative group w-full">
                <div className="absolute -inset-1 bg-spotify-green/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                <Button
                  variant="spotify"
                  className="relative !h-12 sm:!h-14 w-full !rounded-full text-base font-bold transition-all duration-500 shadow-xl"
                >
                  Play now
                </Button>
              </Link>
              <span className="text-xs text-fg/45">No sign-in needed</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <SpotifyButton canSignIn={canSignIn} />
              <span className="text-xs text-fg/45">Play your own library</span>
            </div>
          </div>

          {!canSignIn &&
            (showInvite ? (
              <InviteForm />
            ) : (
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="text-xs text-fg/40 underline underline-offset-4 hover:text-fg/60 transition-colors"
              >
                Have a secret word?
              </button>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

export const UnauthenticatedView = memo(UnauthenticatedViewComponent);
