'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUND_DURATIONS } from '@/consts/consts';

const MAX_ROUNDS = ROUND_DURATIONS.length;

// Blur decreases as rounds progress; only meaningfully recognizable on the last round
const BLUR_PX = [60, 48, 36, 22, 12, 2];

function blurForRound(currentRound: number): number {
  const idx = Math.min(currentRound, MAX_ROUNDS - 1);
  return BLUR_PX[idx] ?? 0;
}

interface AlbumArtRevealProps {
  albumImageUrl: string;
  currentRound: number;
}

export function AlbumArtReveal({
  albumImageUrl,
  currentRound,
}: AlbumArtRevealProps) {
  const blur = blurForRound(currentRound);

  return (
    <AnimatePresence>
      <motion.div
        className="flex justify-center mb-3 sm:mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden ring-1 ring-fg/10 shadow-xl">
          <motion.div
            className="absolute inset-0"
            animate={{ filter: `blur(${blur}px)` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Image
              src={albumImageUrl}
              alt="Album art"
              fill
              className="object-cover scale-110"
              sizes="112px"
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
