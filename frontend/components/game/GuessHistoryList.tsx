'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getGuessResultStyle } from './guess-result-styles';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface Guess {
  trackId?: string | null;
  trackName?: string | null;
  artistName?: string | null;
  result: GuessHistoryDtoResultEnum | null;
}

interface GuessHistoryListProps {
  guesses: Guess[];
  title?: string;
  isGameOver?: boolean;
}

const STAGGER_DELAY = 0.06;

const ITEM_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as const,
      delay: i * STAGGER_DELAY,
    },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

export function GuessHistoryList({
  guesses,
  isGameOver = false,
}: GuessHistoryListProps) {
  const showSection = guesses.length > 0 || !isGameOver;
  if (!showSection) return null;

  return (
    <div className="relative z-0 mt-4 sm:mt-5">
      <motion.div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {guesses.map((guess, i) => {
            const style = getGuessResultStyle(guess.result);
            const isSkip = guess.result === GuessHistoryDtoResultEnum.Skip;
            const staggerIndex = guesses.length - 1 - i;

            return (
              <motion.div
                key={`${i}-${guess.trackId ?? 'skip'}-${guess.result}`}
                variants={ITEM_VARIANTS}
                initial="initial"
                animate="animate"
                custom={staggerIndex}
                exit="exit"
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                  isSkip
                    ? 'bg-white/[0.02]'
                    : 'bg-white/[0.04] border border-white/[0.06]'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                    isSkip
                      ? 'bg-white/[0.06] text-white/25'
                      : `${style.dotClass} text-black`
                  }`}
                >
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 text-sm sm:text-base text-white/90">
                  {isSkip ? (
                    <span className="text-white/30 italic text-sm">Skipped</span>
                  ) : (
                    <>
                      <span className="font-medium">
                        {guess.trackName ?? '—'}
                      </span>
                      {guess.artistName && (
                        <span className="text-white/40">
                          {' · '}
                          {guess.artistName}
                        </span>
                      )}
                    </>
                  )}
                </p>
                {!isSkip && (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/50">
                    {style.label}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
