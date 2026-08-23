'use client';

import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { VolumeSlider } from './VolumeSlider';

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 15 };

interface PlaySnippetButtonProps {
  snippetDuration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
}

export function PlaySnippetButton({
  snippetDuration,
  isPlaying,
  onPlay,
  onPause,
  volume,
  onVolumeChange,
}: PlaySnippetButtonProps) {
  const duration = snippetDuration;

  return (
    <div className="text-center mb-4 sm:mb-6">
      <div className="inline-flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {!isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full z-0 bg-[#1DB954] blur-md"
              animate={{
                scale: [1, 1.35, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.05, transition: SPRING }}
            whileTap={{ scale: 0.95, transition: SPRING }}
            animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={
              isPlaying
                ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 100, damping: 15 }
            }
            aria-label={
              isPlaying ? `Pause snippet` : `Play ${duration} second snippet`
            }
            onClick={isPlaying ? onPause : onPlay}
            // Icon only: the bar above carries the duration now, and the
            // label changing width between states made the row jump.
            className="relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-fg/10 bg-[#1DB954] text-black hover:bg-[#1ed760] touch-manipulation"
            style={{
              boxShadow:
                '0 0 30px -5px rgba(30,215,96,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
            ) : (
              <motion.span whileHover={{ rotate: 10 }} transition={SPRING}>
                {/* Nudged right: a triangle centred on its bounding box reads
                    as sitting left of centre. */}
                <Play
                  className="h-6 w-6 sm:h-7 sm:w-7 translate-x-px"
                  fill="currentColor"
                />
              </motion.span>
            )}
          </motion.button>
        </div>
        <div className="mt-3 w-full flex justify-center">
          <VolumeSlider volume={volume} onVolumeChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
}
