'use client';

import { motion } from 'framer-motion';
import { Snowflake, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useStreakStatus } from '@/hooks/streak/useStreakStatus';
import { useStreakFreeze } from '@/hooks/streak/useStreakFreeze';
import { useEffect, useState } from 'react';

interface StreakFreezePromptProps {
  onResolved: () => void;
}

const ease = [0.16, 1, 0.3, 1] as const;

function getDismissKey(streak: number, gap: number) {
  return `streak-freeze-dismissed:${streak}:${gap}`;
}

function wasDismissed(streak: number, gap: number) {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(getDismissKey(streak, gap)) === '1';
}

function getStreakLostDailyKey(streak: number, gap: number) {
  const today = new Date().toISOString().slice(0, 10);
  return `streak-lost-shown:${streak}:${gap}:${today}`;
}

function wasStreakLostShownToday(streak: number, gap: number) {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getStreakLostDailyKey(streak, gap)) === '1';
}

function markStreakLostShownToday(streak: number, gap: number) {
  localStorage.setItem(getStreakLostDailyKey(streak, gap), '1');
}

export function StreakFreezePrompt({ onResolved }: StreakFreezePromptProps) {
  const { data: status } = useStreakStatus();
  const freezeMutation = useStreakFreeze();
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  const isDismissed =
    manuallyDismissed ||
    (!!status && wasDismissed(status.currentStreak, status.gapDays));

  const shouldSkip =
    !status ||
    !status.streakAtRisk ||
    isDismissed ||
    (!status.canSaveStreak &&
      wasStreakLostShownToday(status.currentStreak, status.gapDays));

  useEffect(() => {
    if (status && status.streakAtRisk && !status.canSaveStreak) {
      markStreakLostShownToday(status.currentStreak, status.gapDays);
    }
  }, [status]);

  useEffect(() => {
    if (shouldSkip) onResolved();
  }, [shouldSkip, onResolved]);

  if (shouldSkip) return null;

  const handleSave = () => {
    freezeMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(
          `Streak saved! Used ${status.freezeCost} ${status.freezeCost === 1 ? 'freeze' : 'freezes'}`,
        );
        onResolved();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to save streak');
      },
    });
  };

  const handleDismiss = () => {
    sessionStorage.setItem(
      getDismissKey(status.currentStreak, status.gapDays),
      '1',
    );
    setManuallyDismissed(true);
    onResolved();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onResolved();
    }
  };

  /* ── Can save ── */
  if (status.canSaveStreak) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease }}
          className="relative rounded-[28px] overflow-hidden max-w-md w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#091520] via-[#0b1a28] to-[#060d14]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,211,238,0.1),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(251,191,36,0.04),transparent)]" />
          <div className="absolute inset-0 rounded-[28px] border border-cyan-400/[0.12]" />

          {/* Close button */}
          <button
            onClick={onResolved}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-fg/5 hover:bg-fg/10 text-fg/40 hover:text-fg/70 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 px-6 pt-10 pb-7">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease }}
                  className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-400/25 to-orange-500/10" />
                  <div className="absolute inset-[1.5px] rounded-full bg-[#0d1820]" />
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4, ease }}
                    className="relative text-[2.25rem] font-black tracking-tighter text-amber-300 leading-none tabular-nums"
                  >
                    {status.currentStreak}
                  </motion.span>
                </motion.div>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="text-center text-[11px] uppercase tracking-[0.15em] text-amber-400/50 font-semibold mb-5"
            >
              day streak
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center mb-6"
            >
              <h2 className="text-[1.35rem] font-extrabold tracking-tight text-fg mb-1">
                Don&apos;t let it die
              </h2>
              <p className="text-fg/45 text-[13px] leading-relaxed">
                You missed{' '}
                <span className="text-amber-400/90 font-semibold">
                  {status.gapDays} {status.gapDays === 1 ? 'day' : 'days'}
                </span>{' '}
                - use a freeze to keep it alive.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex justify-center gap-[7px] mb-7"
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < status.freezesAvailable;
                const spending =
                  i >= status.freezesAvailable - status.freezeCost &&
                  i < status.freezesAvailable;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.3, ease }}
                    className="relative"
                  >
                    {spending && (
                      <div className="absolute -inset-[3px] rounded-[10px] bg-cyan-400/15 animate-[slot-breathe_1.5s_ease-in-out_infinite] will-change-[opacity]" />
                    )}
                    <div
                      className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${
                        spending
                          ? 'bg-cyan-400/15 border border-cyan-400/50'
                          : filled
                            ? 'bg-cyan-500/10 border border-cyan-400/20'
                            : 'bg-fg/[0.02] border border-fg/[0.06]'
                      }`}
                    >
                      <Snowflake
                        className={`w-[18px] h-[18px] ${
                          spending
                            ? 'text-cyan-300'
                            : filled
                              ? 'text-cyan-400/50'
                              : 'text-fg/[0.08]'
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="space-y-3"
            >
              <button
                onClick={handleSave}
                disabled={freezeMutation.isPending}
                className="group relative w-full h-[52px] rounded-2xl font-bold text-[14px] overflow-hidden active:scale-[0.97] transition-transform disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-300 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-x-0 top-0 h-[1px] bg-fg/20" />
                <span className="relative z-10 flex items-center justify-center gap-2.5 text-[#071520]">
                  <Snowflake className="w-[16px] h-[16px]" />
                  {freezeMutation.isPending
                    ? 'Saving...'
                    : `Use ${status.freezeCost} ${status.freezeCost === 1 ? 'freeze' : 'freezes'} to save streak`}
                </span>
              </button>

              <div className="flex items-center justify-between px-1">
                <span className="text-fg/25 text-[11px]">
                  {status.freezesAvailable - status.freezeCost} left after
                </span>
                <button
                  onClick={handleDismiss}
                  className="text-[12px] text-fg/30 hover:text-fg/50 transition-colors py-1 px-2 -mr-2"
                >
                  Don&apos;t show again
                </button>
              </div>

              {status.freezesAvailable < 5 && (
                <Link
                  href="/daily/stats?earnFreezes=1"
                  onClick={onResolved}
                  className="block text-center text-[12px] text-cyan-400/50 hover:text-cyan-400/80 transition-colors pt-1"
                >
                  Earn more freezes by answering trivia &rarr;
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  /* ── Cannot save — streak lost ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease }}
        className="relative rounded-[28px] overflow-hidden max-w-md w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#14101a] via-[#110e16] to-[#0c0a10]" />
        <div className="absolute inset-0 rounded-[28px] border border-fg/[0.05]" />

        {/* Close button */}
        <button
          onClick={onResolved}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-fg/5 hover:bg-fg/10 text-fg/40 hover:text-fg/70 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 px-6 pt-10 pb-7">
          <div className="flex justify-center mb-2">
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease }}
              className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-fg/[0.03]" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#110e16]" />
              <span className="relative text-[2.25rem] font-black tracking-tighter text-fg/15 leading-none line-through decoration-white/10 decoration-2">
                {status.currentStreak}
              </span>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center text-[11px] uppercase tracking-[0.15em] text-fg/15 font-semibold mb-5"
          >
            day streak
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-7"
          >
            <h2 className="text-[1.35rem] font-extrabold tracking-tight text-fg/70 mb-1">
              Streak lost
            </h2>
            <p className="text-fg/35 text-[13px] leading-relaxed">
              {status.gapDays} {status.gapDays === 1 ? 'day' : 'days'} missed.
              {status.isTrusted &&
                status.freezesAvailable < status.freezeCost && (
                  <span className="block mt-1 text-fg/20">
                    Needed {status.freezeCost}{' '}
                    {status.freezeCost === 1 ? 'freeze' : 'freezes'}, had{' '}
                    {status.freezesAvailable}.
                  </span>
                )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-3"
          >
            <button
              onClick={onResolved}
              className="w-full h-[52px] rounded-2xl font-semibold text-[14px] bg-fg/[0.05] border border-fg/[0.08] text-fg/50 hover:bg-fg/[0.08] hover:text-fg/70 transition-all active:scale-[0.97]"
            >
              Start fresh
            </button>

            {status.isTrusted && (
              <Link
                href="/daily/stats?earnFreezes=1"
                onClick={onResolved}
                className="block text-center text-[12px] text-cyan-400/50 hover:text-cyan-400/80 transition-colors"
              >
                Stock up on freezes for next time &rarr;
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
