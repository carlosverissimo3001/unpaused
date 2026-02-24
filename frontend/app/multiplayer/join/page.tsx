'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/auth/useMe';
import { useJoinRoom } from '@/hooks/multiplayer/useJoinRoom';
import { setAuthReturnUrl } from '@/lib/auth-return';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';

export default function JoinManualPage() {
  const [code, setCode] = useState('');
  const router = useRouter();
  const { data: user, isLoading: isLoadingUser } = useMe();
  const joinMutation = useJoinRoom();

  // Auth gate
  useEffect(() => {
    if (isLoadingUser) return;
    if (!user) {
      setAuthReturnUrl('/multiplayer/join');
      window.location.href = '/api/auth/login';
    }
  }, [user, isLoadingUser]);

  // Success: redirect to room lobby
  useEffect(() => {
    if (joinMutation.data) {
      router.replace(`/multiplayer/${joinMutation.data.id}`);
    }
  }, [joinMutation.data, router]);

  function handleInput(value: string) {
    // Filter to valid chars and uppercase
    const filtered = value.replace(/[^A-Za-z2-9]/g, '').toUpperCase();
    setCode(filtered.slice(0, 8));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length === 0) return;
    joinMutation.mutate(code);
  }

  if (isLoadingUser || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-spotify-black">
        <LoadingSpinner size="md" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl"
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
      >
        <h1 className="text-xl font-semibold text-center mb-6">
          Join a Room
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Enter invite code"
            maxLength={8}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center font-mono text-lg tracking-widest text-white uppercase placeholder:text-white/50 placeholder:tracking-normal placeholder:font-sans placeholder:text-base focus:outline-none focus:ring-2 focus:ring-spotify-green"
            autoFocus
            disabled={joinMutation.isPending}
          />

          {joinMutation.isError && (
            <p className="text-sm text-red-400">
              {joinMutation.error.message}
            </p>
          )}

          <Button
            type="submit"
            variant="spotify"
            className="w-full"
            disabled={code.length === 0 || joinMutation.isPending}
          >
            {joinMutation.isPending ? 'Joining…' : 'Join Room'}
          </Button>
        </form>
      </div>
    </main>
  );
}
