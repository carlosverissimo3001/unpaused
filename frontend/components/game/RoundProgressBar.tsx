"use client";

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
    <div className="flex gap-2 mb-6 md:mb-8">
      {ROUND_DURATIONS.slice(0, totalRounds).map((_, index) => {
        const result = guesses[index]?.result;
        const style = result != null ? getGuessResultStyle(result) : null;
        const isCompleted = index < currentRound;
        const isCurrent = !isGameOver && index === currentRound;
        return (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              isCompleted
                ? style?.barClass ?? "bg-red-500"
                : isCurrent
                  ? "bg-spotify-green"
                  : "bg-white/20"
            }`}
          />
        );
      })}
    </div>
  );
}
