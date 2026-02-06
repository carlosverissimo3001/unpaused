"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getGuessResultStyle } from "./guess-result-styles";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";

interface Guess {
  trackId?: string | null;
  trackName?: string | null;
  artistName?: string | null;
  result: string;
}

interface GuessHistoryListProps {
  guesses: Guess[];
  title?: string;
  isGameOver?: boolean;
}

// Bottom-up stagger: newest guess (last in list) appears first, then ripples upward
const STAGGER_DELAY = 0.1;

const ITEM_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      delay: i * STAGGER_DELAY, // i = 0 for newest (last item), so it pops first
    },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function GuessHistoryList({
  guesses,
  title = "Previous guesses",
  isGameOver = false,
}: GuessHistoryListProps) {
  const showSection = guesses.length > 0 || !isGameOver;
  if (!showSection) return null;

  return (
    <div className="mt-2">
      <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
      <motion.div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {guesses.map((guess, i) => {
            const style = getGuessResultStyle(guess.result);
            const isSkip = guess.result === GuessHistoryDtoResultEnum.Skip;
            const isWrong = guess.result === GuessHistoryDtoResultEnum.Wrong;
            // Bottom-up: newest (last index) gets delay 0, second-newest gets 0.1, etc.
            const staggerIndex = guesses.length - 1 - i;

            return (
              <motion.div
                key={i}
                variants={ITEM_VARIANTS}
                initial="initial"
                animate={"animate"}
                custom={staggerIndex}
                exit="exit"
                layout
                className={`p-3 rounded-lg border ${style.cardClass} ${
                  isSkip ? "opacity-50" : ""
                } ${isWrong ? "border-l-[2px] border-l-red-500/60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium min-w-0 text-white">
                    {isSkip ? "Skipped" : guess.trackName ?? "—"}
                  </p>
                  {!isSkip && (
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${style.badgeClass}`}
                    >
                      {style.label}
                    </span>
                  )}
                </div>
                {!isSkip && guess.artistName && (
                  <p className="text-sm text-white/60 mt-0.5">{guess.artistName}</p>
                )}
              </motion.div>
            );
          })}

          {!isGameOver && (
            <motion.div
              key="next-slot"
              layout
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                borderColor: [
                  "rgba(255,255,255,0.08)",
                  "rgba(29,185,84,0.25)",
                  "rgba(255,255,255,0.08)",
                ],
              }}
              transition={{
                opacity: { duration: 0.3 },
                borderColor: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="min-h-[52px] rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02]"
              aria-hidden
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
