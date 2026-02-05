"use client";

import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { ROUND_DURATIONS } from "@/consts/consts";

const SPRING = { type: "spring" as const, stiffness: 100, damping: 15 };

// Playing only: concentric ripples (rings stopped when not playing)
const PLAYING_RING_DURATION = 0.42;
const PLAYING_RING_DELAY = 0.21;

interface PlaySnippetButtonProps {
  currentRound: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export function PlaySnippetButton({ currentRound, isPlaying, onPlay, onPause }: PlaySnippetButtonProps) {
  const duration = ROUND_DURATIONS[currentRound];

  return (
    <div className="text-center mb-6 md:mb-8">
      <div className="relative inline-flex items-center justify-center">
        {/* Decoupled rings — absolute behind button, no layout/scale impact */}
        <div className="absolute inset-0 pointer-events-none rounded-full" aria-hidden>
          {/* Ring 1 — only animates when playing */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#1DB954]/30"
            animate={
              isPlaying ? { scale: [1, 1.75, 1], opacity: [0.5, 0, 0.5] } : { scale: 1, opacity: 0 }
            }
            transition={
              isPlaying
                ? {
                    duration: PLAYING_RING_DURATION,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0,
                  }
                : { duration: 0 }
            }
          />
          {/* Ring 2 — offset when playing */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#1DB954]/30"
            animate={
              isPlaying ? { scale: [1, 1.75, 1], opacity: [0.4, 0, 0.4] } : { scale: 1, opacity: 0 }
            }
            transition={
              isPlaying
                ? {
                    duration: PLAYING_RING_DURATION,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: PLAYING_RING_DELAY,
                  }
                : { duration: 0 }
            }
          />
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05, transition: SPRING }}
          whileTap={{ scale: 0.95, transition: SPRING }}
          animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={
            isPlaying
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : { type: "spring", stiffness: 100, damping: 15 }
          }
          onClick={isPlaying ? onPause : onPlay}
          className="relative z-10 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-8 rounded-full text-lg border border-white/10 shadow-[0_0_30px_-5px_rgba(30,215,96,0.5)]"
          style={{
            boxShadow: "0 0 30px -5px rgba(30,215,96,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
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
    </div>
  );
}
