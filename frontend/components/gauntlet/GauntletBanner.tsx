'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePersonalBest } from '@/hooks/gauntlet/usePersonalBest';
import { useMe } from '@/hooks/auth/useMe';

function GauntletBannerComponent() {
  const { data: user } = useMe();
  const { data: pbData } = usePersonalBest(!!user);
  const personalBest = pbData?.personalBest ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-fg/10 bg-surface p-4 sm:p-6 shadow-2xl group transform-gpu"
    >
      {/* Amber fire glow */}
      <motion.div
        animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-[150px] -right-[80px] w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: 'rgba(251, 146, 60, 0.15)' }}
      />
      <motion.div
        animate={{ rotate: [0, -360], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-[80px] -left-[60px] w-[200px] h-[200px] rounded-full blur-[60px] pointer-events-none"
        style={{ background: 'rgba(239, 68, 68, 0.1)' }}
      />

      <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-col gap-1 sm:gap-3 flex-1 min-w-0">
          <div className="hidden sm:inline-flex items-center gap-2 px-2 py-1 rounded-full bg-fg/5 border border-fg/10 w-fit text-[10px] uppercase tracking-wider font-bold text-fg/70">
            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
            Endless Mode
          </div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h2 className="text-lg sm:text-3xl font-black tracking-tighter text-fg truncate leading-tight">
              The{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #fb923c, #ef4444)',
                }}
              >
                Gauntlet.
              </span>
            </h2>
            <p className="text-fg/50 text-[10px] sm:text-base font-medium truncate">
              {personalBest > 0
                ? `Your best: ${personalBest} 🔥`
                : 'How far can you go?'}
            </p>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              asChild
              className="h-8 sm:h-10 px-3 sm:px-5 !rounded-full text-[11px] sm:text-sm font-bold text-black border-0 shadow-[0_0_20px_rgba(251,146,60,0.3)]"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
              }}
            >
              <Link href="/gauntlet" className="flex items-center gap-2">
                <Play
                  fill="currentColor"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
                <span>Play</span>
                <ArrowRight className="hidden sm:block w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
    </motion.div>
  );
}

export const GauntletBanner = memo(GauntletBannerComponent);
