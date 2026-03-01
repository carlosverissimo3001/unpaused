'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/hooks/auth/useMe';
import { useJoinRoom } from '@/hooks/multiplayer/useJoinRoom';
import { setAuthReturnUrl } from '@/lib/auth-return';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CODE_REGEX = /^[A-Z0-9]{1,8}$/;

export default function JoinByCodePage() {
  const params = useParams<{ code: string }>();
  const rawCode = params.code
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  const isValidCode = CODE_REGEX.test(rawCode);
  const router = useRouter();
  const { data: user, isLoading: isLoadingUser } = useMe();
  const joinMutation = useJoinRoom();
  const joinFiredRef = useRef(false);

  // Auth gate: redirect to login if not authenticated
  useEffect(() => {
    if (isLoadingUser || !isValidCode) return;
    if (!user) {
      setAuthReturnUrl(`/multiplayer/join/${rawCode}`);
      window.location.href = '/api/auth/login';
    }
  }, [user, isLoadingUser, rawCode, isValidCode]);

  // Auto-fire join mutation once authenticated
  useEffect(() => {
    if (!user || !isValidCode || joinFiredRef.current) return;
    joinFiredRef.current = true;
    joinMutation.mutate(rawCode);
  }, [user, rawCode, isValidCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Success: redirect to the room lobby
  useEffect(() => {
    if (joinMutation.data) {
      router.replace(`/multiplayer/${joinMutation.data.id}`);
    }
  }, [joinMutation.data, router]);

  // Invalid code in URL
  if (!isValidCode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl text-center"
          style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
        >
          <p className="text-red-400 mb-2 font-semibold">Invalid invite code</p>
          <p className="text-white/50 text-sm mb-4">
            The code in the link doesn&apos;t look right. Try entering it
            manually.
          </p>
          <Link
            href="/multiplayer/join"
            className="text-spotify-green hover:underline text-sm"
          >
            Enter code manually
          </Link>
        </div>
      </main>
    );
  }

  if (joinMutation.isError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl text-center"
          style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
        >
          <p className="text-red-400 mb-4">{joinMutation.error.message}</p>
          <Link href="/" className="text-spotify-green hover:underline text-sm">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-spotify-black text-white">
      <LoadingSpinner size="md" />
      <p className="text-white/60 text-sm">Joining room...</p>
    </main>
  );
}
