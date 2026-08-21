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

function UnauthenticatedViewComponent({ canSignIn }: { canSignIn: boolean }) {
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
            Test your musical ear - no sign-in required. Connect Spotify later
            for your own library and stats.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <Link href="/game/guest" className="relative group">
            <div className="absolute -inset-1 bg-spotify-green/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
            <Button
              variant="spotify"
              className="relative !h-12 sm:!h-16 px-8 sm:px-10 !rounded-full text-sm sm:text-base font-bold transition-all duration-500 w-fit min-w-[240px] shadow-xl"
            >
              Play now
            </Button>
          </Link>

          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {canSignIn ? (
              <a href="/api/auth/login">
                <Button
                  variant="outline"
                  className="!h-11 sm:!h-14 px-6 sm:px-8 !rounded-full text-sm font-semibold"
                >
                  <Image
                    src="/spotify-icon.svg"
                    alt="Spotify"
                    width={20}
                    height={20}
                    className="mr-2.5 shrink-0"
                  />
                  Continue with Spotify
                </Button>
              </a>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled
                  aria-describedby="invite-note"
                  className="!h-11 sm:!h-14 px-6 sm:px-8 !rounded-full text-sm font-semibold"
                >
                  <Image
                    src="/spotify-icon.svg"
                    alt="Spotify"
                    width={20}
                    height={20}
                    className="mr-2.5 shrink-0"
                  />
                  Continue with Spotify
                </Button>

                <p
                  id="invite-note"
                  className="max-w-md text-sm text-fg/50 leading-relaxed"
                >
                  Spotify caps apps in development mode at 5 users, so signing
                  in with your own library is invite only for now. If I gave you
                  a secret word, drop it in below.
                </p>

                <InviteForm />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export const UnauthenticatedView = memo(UnauthenticatedViewComponent);
