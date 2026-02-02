"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { ROUND_DURATIONS } from "@/consts/consts";

interface PlaySnippetButtonProps {
  currentRound: number;
  isPlaying: boolean;
  onPlay: () => void;
}

export function PlaySnippetButton({
  currentRound,
  isPlaying,
  onPlay,
}: PlaySnippetButtonProps) {
  const duration = ROUND_DURATIONS[currentRound];
  return (
    <div className="text-center mb-6 md:mb-8">
      <motion.div
        animate={{
          boxShadow: isPlaying
            ? "0 0 20px rgba(30, 215, 96, 0.3)"
            : [
                "0 0 20px rgba(30, 215, 96, 0.3)",
                "0 0 40px rgba(30, 215, 96, 0.5)",
                "0 0 20px rgba(30, 215, 96, 0.3)",
              ],
        }}
        transition={
          isPlaying
            ? { duration: 0.3 }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
        className="inline-block rounded-full"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          disabled={isPlaying}
          className="bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 text-black font-bold py-4 px-8 rounded-full text-lg transition-all relative z-10"
        >
          {isPlaying ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
              </motion.span>
              Playing {duration}s...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5" fill="currentColor" />
              Play {duration}s Snippet
            </span>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
