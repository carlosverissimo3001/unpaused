"use client";

import { Calendar } from "lucide-react";
import { ROUND_DURATIONS } from "@/consts/consts";
import type { GameMode } from "./types";

interface GameTitleProps {
  mode: GameMode;
  currentRound: number;
  isGameOver: boolean;
}

export function GameTitle({ mode, currentRound, isGameOver }: GameTitleProps) {
  if (mode === "playlist") {
    return (
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Guess the Song</h1>
        <p className="text-white/60 text-sm md:text-base">
          Round{" "}
          {Math.min(
            isGameOver ? currentRound : currentRound + 1,
            ROUND_DURATIONS.length
          )}{" "}
          of {ROUND_DURATIONS.length}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center mb-6 md:mb-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-1">Daily Challenge</h1>
      <p className="text-white/60 flex items-center justify-center gap-2 text-sm">
        <Calendar className="w-4 h-4" />
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
