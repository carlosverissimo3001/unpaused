'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/hooks/auth/useMe';
import { useJoinRoom } from '@/hooks/multiplayer/useJoinRoom';
import { setAuthReturnUrl } from '@/lib/auth-return';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function JoinByCodePage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const router = useRouter();
  const { data: user, isLoading: isLoadingUser } = useMe();
  const joinMutation = useJoinRoom();
  const joinFiredRef = useRef(false);

  // Auth gate: redirect to login if not authenticated
  useEffect(() => {
    if (isLoadingUser) return;
    if (!user) {
      setAuthReturnUrl(`/multiplayer/join/${code}`);
      window.location.href = '/api/auth/login';
    }
  }, [user, isLoadingUser, code]);

  // Auto-fire join mutation once authenticated
  useEffect(() => {
    if (!user || joinFiredRef.current) return;
    joinFiredRef.current = true;
    joinMutation.mutate(code);
  }, [user, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Success: redirect to the room lobby
  useEffect(() => {
    if (joinMutation.data) {
      router.replace(`/multiplayer/${joinMutation.data.id}`);
    }
  }, [joinMutation.data, router]);

  if (joinMutation.isError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl text-center"
          style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
        >
          <p className="text-red-400 mb-4">{joinMutation.error.message}</p>
          <Link
            href="/"
            className="text-spotify-green hover:underline text-sm"
          >
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
