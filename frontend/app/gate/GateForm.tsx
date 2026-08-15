'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { safeNext } from '@/lib/safe-next';
import { useSiteUnlock } from '@/hooks/auth/useSiteUnlock';

export function GateForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { unlock, error, pending, clearError } = useSiteUnlock();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (await unlock(password)) {
      // A hard navigation, not router.push: the private zone is a rewrite to
      // another deployment, so there is no route here for the client router to
      // resolve. Letting the server handle it is what makes the rewrite apply.
      window.location.href = next;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center text-fg p-4">
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-fg/10 bg-fg/5 p-8 shadow-xl backdrop-blur-xl"
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}
      >
        <h1 className="text-xl font-semibold text-center mb-6">
          Enter password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              placeholder="Password"
              className="w-full rounded-lg border border-fg/20 bg-fg/10 pl-4 pr-12 py-3 text-fg placeholder:text-fg/50 focus:outline-none focus:ring-2 focus:ring-spotify-green"
              autoFocus
              autoComplete="current-password"
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/50 hover:text-fg transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {error && <p className="text-sm text-red-400">Incorrect Password</p>}
          <Button
            type="submit"
            variant="spotify"
            className="w-full"
            disabled={pending}
          >
            {pending ? 'Checking…' : 'Unlock'}
          </Button>
        </form>
      </div>
    </main>
  );
}
