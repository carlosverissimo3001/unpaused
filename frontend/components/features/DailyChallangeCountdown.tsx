'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, startOfDay, differenceInSeconds } from 'date-fns';

export function DailyChallengeCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();

      const tomorrow = startOfDay(addDays(now, 1));

      const totalSeconds = Math.max(0, differenceInSeconds(tomorrow, now));

      if (totalSeconds <= 0) {
        void queryClient.invalidateQueries({ queryKey: ['playedToday'] });
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
  }, [queryClient]);

  if (!isLoaded) return null;

  return (
    <div className="flex items-center w-fit">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="shrink-0 self-center flex items-center"
        >
          <Clock className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-spotify-green" />
        </motion.div>

        <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-spotify-green/90 mr-0.5 whitespace-nowrap">
          Next Drop:
        </span>

        <div className="flex items-center font-mono font-bold text-fg text-[11px] sm:text-lg tabular-nums">
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
  const displayValue = value.toString().padStart(2, '0');

  return (
    <div className="flex items-baseline shrink-0">
      <div className="relative h-[1.2em] overflow-hidden flex items-center justify-center min-w-[2.2ch] sm:min-w-[1.2ch]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayValue}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
              mass: 0.8,
            }}
            className="inline-block"
          >
            {displayValue}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[7px] sm:text-[10px] ml-0.5 opacity-60 font-sans font-normal uppercase">
        {label}
      </span>
    </div>
  );
}
