'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, X } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';

const ASKED_KEY = 'unpaused:name-prompt-asked';

function readAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1');
  } catch {
    // A blocked store only costs us the prompt opening again.
  }
}

/**
 * The first conversion ask, and the only one that costs nothing to say yes to:
 * a name, no password and no email. It opens once, after a round rather than
 * before, when there is already something worth putting a name on. Afterwards
 * it stays as a quiet line, so someone who goes looking still finds it.
 */
export function ClaimNamePrompt() {
  const { data: user } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [expanded, setExpanded] = useState(() => !readAsked());
  const [name, setName] = useState('');

  // Someone with an account already has a name they chose.
  if (!user || user.hasLinkedAccount) {
    return null;
  }

  function close() {
    writeAsked();
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mx-auto flex items-center gap-1.5 text-[11px] font-bold text-fg/35 hover:text-fg/70 transition-colors"
      >
        Playing as {user.displayName}
        <Pencil className="w-3 h-3" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-fg/10 bg-fg/[0.04] p-4"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-fg/30 hover:text-fg/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <p className="text-sm font-black tracking-tight text-fg pr-6">
        You&apos;re playing as {user.displayName}
      </p>
      <p className="mt-0.5 text-xs text-fg/50 tracking-tight">
        Pick something better. No email, no password.
      </p>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          updateProfile(trimmed, { onSuccess: close });
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Your name"
          aria-label="Your name"
          className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-fg/5 px-3 py-2 text-sm text-fg placeholder:text-fg/30 focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          aria-label="Save name"
          className="flex items-center justify-center h-9 w-9 shrink-0 rounded-xl bg-spotify-green text-black disabled:opacity-40 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
