'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake } from 'lucide-react';
import { useStreakStatus } from '@/hooks/streak/useStreakStatus';
import { EarnFreezesFlow } from '@/components/streak/EarnFreezesFlow';

interface StreakFreezeCardProps {
  /** Opens straight into the quiz, for the links that used ?earnFreezes=1. */
  openQuiz?: boolean;
}

/**
 * Earning freezes lived on /daily/stats, which is gone. It belongs beside the
 * streak it protects, so it sits under the daily tab's numbers instead.
 */
export function StreakFreezeCard({ openQuiz = false }: StreakFreezeCardProps) {
  const { data: status } = useStreakStatus();
  const [showQuiz, setShowQuiz] = useState(openQuiz);

  if (!status?.isTrusted) return null;

  return (
    <AnimatePresence mode="wait">
      {showQuiz ? (
        <motion.div
          key="quiz"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="p-5 rounded-2xl backdrop-blur-md border border-cyan-400/20 bg-cyan-500/5"
        >
          <EarnFreezesFlow
            freezesAvailable={status.freezesAvailable}
            onClose={() => setShowQuiz(false)}
          />
        </motion.div>
      ) : (
        <motion.button
          key="button"
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          onClick={() => setShowQuiz(true)}
          className="w-full p-4 rounded-2xl backdrop-blur-md border border-cyan-400/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0">
            <Snowflake className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-fg">Streak freezes</p>
            <p className="text-xs text-fg/50">Answer trivia to earn freezes</p>
          </div>
          <span className="text-lg font-bold text-cyan-400 tabular-nums">
            {status.freezesAvailable}/5
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
