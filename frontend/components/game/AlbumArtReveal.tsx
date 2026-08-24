'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_BLUR = 45;
const MIN_BLUR = 2;

function blurForRound(currentRound: number, maxRounds: number): number {
  if (maxRounds <= 1) {
    return currentRound <= 0 ? MAX_BLUR : MIN_BLUR;
  }

  const clamped = Math.max(0, Math.min(currentRound, maxRounds - 1));
  const progress = clamped / (maxRounds - 1);
  return Math.round(MAX_BLUR - progress * (MAX_BLUR - MIN_BLUR));
}

interface AlbumArtRevealProps {
  albumImageUrl: string;
  currentRound: number;
  maxRounds: number;
}

export function AlbumArtReveal({
  albumImageUrl,
  currentRound,
  maxRounds,
}: AlbumArtRevealProps) {
  const blur = blurForRound(currentRound, maxRounds);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className="flex justify-center mb-3 sm:mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-fg/10">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-fg/10" />
          )}
          <motion.div
            className="absolute inset-0"
            animate={{ filter: `blur(${blur}px)` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Image
              src={albumImageUrl}
              alt="Album art"
              fill
              className={`object-cover scale-110 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="112px"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
