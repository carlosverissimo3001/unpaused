"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { ROUND_DURATIONS } from "@/consts/consts";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";

interface GameTitleProps {
  mode: GameMode;
  currentRound: number;
}

export function GameTitle({ mode, currentRound }: GameTitleProps) {
  if (mode === GameMode.All) {
    return (
      <div className="text-center mb-6 md:mb-8">
        <h1
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 tracking-tight text-white"
          style={{
            letterSpacing: "-0.02em",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}
        >
          Guess the Song
        </h1>
        <p className="text-[#b3b3b3] text-sm md:text-base font-medium">
          Round {Math.min(currentRound + 1, ROUND_DURATIONS.length)} of{" "}
          {ROUND_DURATIONS.length}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center mb-6 md:mb-8">
      <h1
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 tracking-tight text-white"
        style={{
          letterSpacing: "-0.02em",
          textShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        Daily Challenge
      </h1>
      <p className="text-[#b3b3b3] flex items-center justify-center gap-2 text-sm md:text-base font-medium">
        <motion.span whileHover={{ rotate: 10 }}>
          <Calendar className="w-4 h-4 inline-block" />
        </motion.span>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
