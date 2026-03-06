'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { ROUND_DURATIONS } from '@/consts/consts';
import { VolumeSlider } from './VolumeSlider';

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 15 };

interface PlaySnippetButtonProps {
  currentRound: number;
  isPlaying: boolean;
  amplitude: MotionValue<number>;
  onPlay: () => void;
  onPause: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
}

export function PlaySnippetButton({
  currentRound,
  isPlaying,
  amplitude,
  onPlay,
  onPause,
  volume,
  onVolumeChange,
}: PlaySnippetButtonProps) {
  const duration = ROUND_DURATIONS[currentRound];

  const ring1Scale = useTransform(amplitude, [0, 1], [1, 1.75]);
  const ring1Opacity = useTransform(amplitude, [0, 1], [0, 0.6]);

  const ring2Scale = useTransform(amplitude, [0, 1], [1, 1.5]);
  const ring2Opacity = useTransform(amplitude, [0, 1], [0, 0.4]);

  return (
    <div className="text-center mb-4 sm:mb-6">
      <div className="inline-flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute inset-0 pointer-events-none rounded-full"
            aria-hidden
          >
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#1DB954]/30"
              style={{ scale: ring1Scale, opacity: ring1Opacity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#1DB954]/30"
              style={{ scale: ring2Scale, opacity: ring2Opacity }}
            />
          </div>

          {!isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full z-0"
              animate={{
                boxShadow: [
                  '0 0 20px 4px rgba(30,215,96,0.15)',
                  '0 0 40px 8px rgba(30,215,96,0.3)',
                  '0 0 20px 4px rgba(30,215,96,0.15)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
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
            className="relative z-10 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg border border-white/10 min-h-[48px] touch-manipulation"
            style={{
              boxShadow:
                '0 0 30px -5px rgba(30,215,96,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {isPlaying ? (
              <span className="flex items-center gap-2">
                <Pause className="w-5 h-5" fill="currentColor" />
                Playing {duration}s...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <motion.span whileHover={{ rotate: 10 }} transition={SPRING}>
                  <Play className="w-5 h-5" fill="currentColor" />
                </motion.span>
                Play {duration}s Snippet
              </span>
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
