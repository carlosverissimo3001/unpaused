'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/hooks/auth/useMe';
import { useEnsureSession } from '@/hooks/auth/useEnsureSession';
import { useJoinRoom } from '@/hooks/multiplayer/useJoinRoom';
import { setAuthReturnUrl } from '@/lib/auth-return';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CODE_REGEX = /^[A-Z0-9]{1,8}$/;

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center text-fg p-4">
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-fg/10 bg-fg/5 p-8 shadow-xl backdrop-blur-xl text-center"
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
      >
        {children}
      </div>
    </main>
  );
}

export function JoinByCodeClient({ canSignIn }: { canSignIn: boolean }) {
  const params = useParams<{ code: string }>();
  const rawCode = params.code
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  const isValidCode = CODE_REGEX.test(rawCode);
  const router = useRouter();
  const { data: user, isLoading: isLoadingUser } = useMe();
  const ensureSession = useEnsureSession();
  const joinMutation = useJoinRoom();
  const joinFiredRef = useRef(false);

  // Auto-fire the join once there is someone to join as.
  useEffect(() => {
    if (!user || !isValidCode || joinFiredRef.current) return;
    joinFiredRef.current = true;
    joinMutation.mutate(rawCode);
  }, [user, rawCode, isValidCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (joinMutation.data) {
      router.replace(`/multiplayer/${joinMutation.data.id}`);
    }
  }, [joinMutation.data, router]);

  if (!isValidCode) {
    return (
      <Card>
        <p className="text-red-400 mb-2 font-semibold">Invalid invite code</p>
        <p className="text-fg/50 text-sm mb-4">
          The code in the link doesn&apos;t look right. Try entering it
          manually.
        </p>
        <Link
          href="/multiplayer/join"
          className="text-spotify-green hover:underline text-sm"
        >
          Enter code manually
        </Link>
      </Card>
    );
  }

  if (joinMutation.isError) {
    return (
      <Card>
        <p className="text-red-400 mb-4">{joinMutation.error.message}</p>
        <Link href="/" className="text-spotify-green hover:underline text-sm">
          Back to home
        </Link>
      </Card>
    );
  }

  // An identity is minted by a deliberate click, never a page load — otherwise
  // every crawler that follows an invite link creates a user.
  if (!isLoadingUser && !user) {
    return (
      <Card>
        <p className="text-xs uppercase tracking-widest text-fg/40 mb-2">
          You&apos;ve been invited
        </p>
        <p className="text-fg/70 text-sm mb-6">
          Room <span className="font-mono font-semibold">{rawCode}</span> is
          waiting for you.
        </p>

        <button
          type="button"
          onClick={() => ensureSession.mutate()}
          disabled={ensureSession.isPending}
          className="w-full !rounded-full bg-spotify-green px-6 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {ensureSession.isPending ? 'Getting you in...' : 'Join the room'}
        </button>

        {canSignIn && (
          <button
            type="button"
            onClick={() => {
              setAuthReturnUrl(`/multiplayer/join/${rawCode}`);
              window.location.href = '/api/auth/login';
            }}
            className="mt-3 w-full !rounded-full border border-fg/15 px-6 py-3 text-sm font-medium text-fg/70 transition hover:bg-fg/5"
          >
            Sign in with Spotify first
          </button>
        )}

        {ensureSession.isError && (
          <p className="mt-4 text-sm text-red-400">
            Could not get you in. Try again.
          </p>
        )}
      </Card>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-fg">
      <LoadingSpinner size="md" />
      <p className="text-fg/60 text-sm">Joining room...</p>
    </main>
  );
}
