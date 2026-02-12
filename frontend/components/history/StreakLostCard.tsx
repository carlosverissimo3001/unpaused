'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { formatDateRange } from '@/utils/date-utils';

interface StreakLostCardProps {
  from: string;
  to: string;
  gapDays: number;
  staggerIndex?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
};

export function StreakLostCard({
  from,
  to,
  gapDays,
  staggerIndex = 0,
}: StreakLostCardProps) {
  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={staggerIndex}
      className="group relative rounded-xl overflow-hidden border border-white/[0.06] backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1115] via-[#161014] to-[#110d10]" />

      <div className="relative flex">
        <div className="w-1 shrink-0 bg-gradient-to-b from-red-500/40 via-red-500/20 to-red-500/5" />

        <div className="px-3.5 py-2.5 flex-1 min-w-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-red-400/30" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-white/40">
              Streak lost
            </span>
            <p className="text-[11px] text-white/25">
              {formatDateRange(from, to)}
              <span className="ml-1.5">
                · {gapDays === 1 ? '1 day missed' : `${gapDays} days missed`}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
