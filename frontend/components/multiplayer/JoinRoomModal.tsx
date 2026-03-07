'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Users, Loader2 } from 'lucide-react';
import { useJoinRoom } from '@/hooks/multiplayer/useJoinRoom';

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const [code, setCode] = useState('');
  const router = useRouter();
  const joinRoom = useJoinRoom();

  const extractCodeFromInput = (value: string): string => {
    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    const joinPathPattern = /(?:^|\/+)multiplayer\/join\/([^/?#\s]+)/i;
    const pathMatch = trimmed.match(joinPathPattern);
    const candidate = pathMatch?.[1] ?? trimmed;

    return candidate
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8);
  };

  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleEsc);
      // Prevent scrolling on the body when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const handleCodeChange = (value: string) => {
    setCode(extractCodeFromInput(value));
  };

  const handleSubmit = useCallback(() => {
    if (!code || joinRoom.isPending) return;
    joinRoom.mutate(code, {
      onSuccess: (data) => {
        router.push(`/multiplayer/${data.id}`);
        onClose();
      },
    });
  }, [code, joinRoom, router, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-fg/10 bg-surface shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none opacity-50"
              style={{
                background:
                  'radial-gradient(circle, rgba(30,215,96,0.15) 0%, transparent 70%)',
              }}
            />

            <div className="relative p-6 sm:p-8">
              <button
                onClick={onClose}
                aria-label="Close join room modal"
                className="absolute top-4 right-4 p-2 rounded-lg text-fg/40 hover:text-fg hover:bg-fg/10 transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green/50"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-spotify-green/10 border border-spotify-green/20"
                  aria-hidden="true"
                >
                  <Users className="w-6 h-6 text-spotify-green" />
                </div>
                <div>
                  <h2
                    id={titleId}
                    className="text-xl font-bold text-fg tracking-tight"
                  >
                    Join Room
                  </h2>
                  <p id={descriptionId} className="text-sm text-fg/50">
                    Enter the invite code to join your friends.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="room-code-input" className="sr-only">
                    Invite Code
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="ABCD1234"
                    maxLength={8}
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full rounded-xl border border-fg/10 bg-fg/5 px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.4em] text-fg placeholder:text-fg/10 focus:border-spotify-green/50 focus:outline-none focus:ring-1 focus:ring-spotify-green/30 transition-all uppercase"
                  />
                </div>

                <AnimatePresence mode="wait">
                  {joinRoom.isError && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-400 text-center font-medium"
                    >
                      {joinRoom.error.message}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleSubmit}
                  disabled={!code || joinRoom.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-spotify-green px-6 py-4 text-base font-bold text-black hover:bg-spotify-green/90 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  {joinRoom.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Join Game
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
