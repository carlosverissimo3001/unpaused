"use client";

import { motion } from "framer-motion";
import { getGuessResultStyle } from "./guess-result-styles";
import { ROUND_DURATIONS } from "@/consts/consts";

interface Guess {
  result: string;
}

interface RoundProgressBarProps {
  currentRound: number;
  guesses: Guess[];
  isGameOver: boolean;
  totalRounds?: number;
}

export function RoundProgressBar({
  currentRound,
  guesses,
  isGameOver,
  totalRounds = ROUND_DURATIONS.length,
}: RoundProgressBarProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 md:mb-8">
      {ROUND_DURATIONS.slice(0, totalRounds).map((_, index) => {
        const result = guesses[index]?.result;
        const style = result != null ? getGuessResultStyle(result) : null;
        const isCompleted = index < currentRound;
        const isCurrent = !isGameOver && index === currentRound;

        return (
          <motion.div
            key={index}
            layout
            className="flex-1 h-1.5 sm:h-2 rounded-full relative overflow-visible"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div
              className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                isCompleted
                  ? style?.barClass ?? "bg-red-500"
                  : isCurrent
                  ? "bg-[#1DB954]"
                  : "bg-white/20"
              }`}
              {...(isCurrent && {
                animate: {
                  boxShadow: [
                    "0 0 8px rgba(29, 185, 84, 0.4)",
                    "0 0 16px rgba(29, 185, 84, 0.6)",
                    "0 0 8px rgba(29, 185, 84, 0.4)",
                  ],
                },
                transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
              })}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
