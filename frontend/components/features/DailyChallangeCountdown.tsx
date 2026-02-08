"use client";

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { startOfDay, addDays, differenceInSeconds } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export function DailyChallengeCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const nowUtc = toZonedTime(now, "UTC");
      const nextReset = startOfDay(addDays(nowUtc, 1));
      
      const totalSeconds = differenceInSeconds(nextReset, nowUtc);

      if (totalSeconds <= 0) {
        queryClient.invalidateQueries({ queryKey: ["playedToday"] });
      }
      
      setTimeLeft({
        h: Math.floor(totalSeconds / 3600),
        m: Math.floor((totalSeconds % 3600) / 60),
        s: totalSeconds % 60,
      });
      setIsLoaded(true);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-spotify-green/10 rounded-lg border border-spotify-green/20 backdrop-blur-md">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Clock className="w-4 h-4 text-spotify-green" />
        </motion.div>
        
        <span className="text-[10px] font-black uppercase tracking-widest text-spotify-green/80 mr-1">
          Next Drop:
        </span>

        <div className="flex items-center font-mono font-bold text-white text-sm sm:text-lg">
          <RollingDigit value={timeLeft.h} label="h" />
          <span className="mx-0.5 opacity-30">:</span>
          <RollingDigit value={timeLeft.m} label="m" />
          <span className="mx-0.5 opacity-30">:</span>
          <RollingDigit value={timeLeft.s} label="s" />
        </div>
      </div>
    </div>
  );
}

function RollingDigit({ value, label }: { value: number; label: string }) {
  const displayValue = value.toString().padStart(2, "0");

  return (
    <div className="flex items-baseline">
      <div className="relative h-[24px] overflow-hidden flex">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayValue}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="inline-block"
          >
            {displayValue}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] ml-0.5 opacity-40 font-sans">{label}</span>
    </div>
  );
}