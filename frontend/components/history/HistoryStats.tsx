"use client";

import { useEffect, useState } from "react";
import { Flame, Star } from "lucide-react";
import { motion, animate } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GameStatsDto } from "../../sdk";

const SIZE = 64;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RING_DURATION = 1.2;

function WinRateCircle({ wins, total }: { wins: number; total: number }) {
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const targetOffset = CIRCUMFERENCE - (rate / 100) * CIRCUMFERENCE;
  const [displayRate, setDisplayRate] = useState(0);

  useEffect(() => {
    const ring = animate(CIRCUMFERENCE, targetOffset, {
      duration: RING_DURATION,
      ease: "easeOut",
      onUpdate: (latestOffset) => {
        const fillRatio = 1 - latestOffset / CIRCUMFERENCE;
        setDisplayRate(Math.min(rate, Math.round(fillRatio * 100)));
      },
    });
    return () => ring.stop();
  }, [rate, targetOffset]);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative cursor-default"
            aria-label={`Win rate: ${rate}%. ${wins} wins of ${total} games.`}
          >
            <svg width={SIZE} height={SIZE} className="rotate-[-90deg]" aria-hidden>
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                className="text-white/10"
              />
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: targetOffset }}
                transition={{ duration: RING_DURATION, ease: "easeOut" }}
                className="text-spotify-green"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white/90 tabular-nums">
              {displayRate}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-white/10 text-white border-white/10 backdrop-blur-md"
        >
          <span className="text-white/90 font-semibold">{total}</span>
          <span className="text-white/40"> games</span>
          <span className="text-white/40"> vs </span>
          <span className="text-white/90 font-semibold">{wins}</span>
          <span className="text-white/40"> wins</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}



export interface HistoryStatsProps {
  stats: GameStatsDto
}

export function HistoryStats({ stats }: HistoryStatsProps) {
  const total = stats.totalGames;
  const wins = stats.totalWins;
  const streak = stats.currentStreak;
  const perfectScores = stats.roundDistribution[0] || 0; // 0th index === wins on 1st round

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm p-4 flex flex-col items-center gap-2"
      >
        <WinRateCircle wins={wins} total={total} />
        <span className="font-black text-[10px] uppercase tracking-widest text-white/40">
          Win rate
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm p-4 flex flex-col items-center gap-2"
      >
        <div className="flex flex-col items-center justify-center h-[64px] gap-0.5">
          <motion.div
            animate={streak > 3 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          >
            <Flame className="w-8 h-8 text-spotify-green" strokeWidth={2} />
          </motion.div>
          <span className="text-lg font-bold text-white/90 tabular-nums">{streak}</span>
        </div>
        <span className="font-black text-[10px] uppercase tracking-widest text-white/40">
          Current streak
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm p-4 flex flex-col items-center gap-2"
      >
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex flex-col items-center justify-center h-[64px] gap-0.5 cursor-default"
                aria-label={`${perfectScores} perfect scores. A perfect score is winning on the first guess.`}
              >
                <Star className="w-8 h-8 text-amber-400/90" strokeWidth={2} fill="currentColor" />
                <span className="text-lg font-bold text-white/90 tabular-nums">
                  {perfectScores}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-white/10 text-white border-white/10 backdrop-blur-md"
            >
              <span className="text-white/90 font-semibold">Perfect score</span>
              <span className="text-white/40"> = win on the first guess</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="font-black text-[10px] uppercase tracking-widest text-white/40">
          Perfect scores
        </span>
      </motion.div>
    </div>
  );
}
