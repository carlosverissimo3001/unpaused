'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks/auth/useLogin';
import { useSignup } from '@/hooks/auth/useSignup';

const MIN_PASSWORD_LENGTH = 8;

type Mode = 'signup' | 'login';

interface CredentialsFormProps {
  initialMode?: Mode;
  initialEmail?: string;
  onDone?: () => void;
}

export function CredentialsForm({
  initialMode = 'signup',
  initialEmail = '',
  onDone,
}: CredentialsFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  const signup = useSignup();
  const login = useLogin();
  const active = mode === 'signup' ? signup : login;

  const tooShort = mode === 'signup' && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit = !!email && !!password && !tooShort && !active.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    active.mutate({ email, password }, { onSuccess: () => onDone?.() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
        className="w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        // A returning player has their email already; the password is all
        // that is left to supply.
        autoFocus={!!initialEmail}
        required
        className="w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
      />

      {mode === 'signup' && (
        <p className="px-1 text-[11px] text-fg/40">
          At least {MIN_PASSWORD_LENGTH} characters. There is no password reset
          yet, so pick one you will remember.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-spotify-green text-sm font-black text-black transition-[background-color,opacity] hover:bg-spotify-green/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {active.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>

      {active.isError && (
        <p role="alert" className="px-1 text-xs text-red-400">
          {active.error.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signup' ? 'login' : 'signup');
          signup.reset();
          login.reset();
        }}
        className="cursor-pointer px-1 text-left text-[11px] text-fg/45 underline-offset-2 hover:text-fg/70 hover:underline"
      >
        {mode === 'signup'
          ? 'Already have an account? Sign in'
          : 'No account yet? Create one'}
      </button>
    </form>
  );
}
