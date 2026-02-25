'use client';

import { useCreateRoom } from '@/hooks/multiplayer/useCreateRoom';
import type { CreateRoomDtoRoundCountEnum } from '@/sdk';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Music, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

const ROUND_OPTIONS: {
  value: CreateRoomDtoRoundCountEnum;
  label: string;
  description: string;
}[] = [
  { value: 3, label: '3', description: 'Quick' },
  { value: 5, label: '5', description: 'Classic' },
  { value: 10, label: '10', description: 'Marathon' },
];

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const [roundCount, setRoundCount] = useState<CreateRoomDtoRoundCountEnum>(5);
  const router = useRouter();
  const createRoom = useCreateRoom();
  const modalRef = useRef<HTMLDivElement>(null);

  const modalId = useId();
  const titleId = `${modalId}-title`;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    modalRef.current?.focus();

    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const handleCreate = useCallback(() => {
    if (createRoom.isPending) return;
    createRoom.mutate(roundCount, {
      onSuccess: (data) => {
        router.push(`/multiplayer/${data.id}`);
        onClose();
      },
    });
  }, [roundCount, createRoom, router, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            ref={modalRef}
            tabIndex={-1} // Makes the div focusable via JS
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl outline-none"
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
                  'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
              }}
            />

            <div className="relative p-6 sm:p-8">
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors focus:ring-2 focus:ring-purple-500/50 outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 id={titleId} className="text-xl font-bold text-white">
                    Create Room
                  </h2>
                  <p className="text-sm text-white/50">
                    Set up a multiplayer game
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div
                  role="radiogroup"
                  aria-labelledby="rounds-label"
                  className="space-y-4"
                >
                  <label
                    id="rounds-label"
                    className="flex items-center gap-2 text-sm font-medium text-white/70"
                  >
                    <Music className="w-4 h-4" aria-hidden="true" />
                    Number of Rounds
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {ROUND_OPTIONS.map((option) => {
                      const isSelected = roundCount === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setRoundCount(option.value)}
                          className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-spotify-green/50 ${
                            isSelected
                              ? 'border-spotify-green/40 bg-spotify-green/10 text-white'
                              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          <span className="text-2xl font-bold font-mono">
                            {option.label}
                          </span>
                          <span
                            className={`text-xs ${isSelected ? 'text-spotify-green' : 'text-white/40'}`}
                          >
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {createRoom.isError && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-400 text-center font-medium"
                      >
                        {createRoom.error.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleCreate}
                    disabled={createRoom.isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-spotify-green px-6 py-4 text-base font-bold text-black hover:bg-spotify-green/90 active:scale-[0.98] disabled:opacity-40 transition-all outline-none focus:ring-4 focus:ring-spotify-green/20"
                  >
                    {createRoom.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5" aria-hidden="true" />
                        Create Room
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
