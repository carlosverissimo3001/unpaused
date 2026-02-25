import Image from 'next/image';
import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Music } from 'lucide-react';
import type { ScoreboardRoundDto } from '@/sdk';

interface RoundBreakdownProps {
  rounds: ScoreboardRoundDto[];
}

function RoundBreakdownBase({ rounds }: RoundBreakdownProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  if (rounds.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="mb-8"
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white/75">
        <Music className="h-4 w-4" />
        Round Breakdown
      </h2>

      <div className="space-y-2">
        {rounds.map((round) => {
          const isExpanded = expandedRound === round.roundIndex;
          const contentId = `round-breakdown-${round.roundIndex}`;

          return (
            <div
              key={round.roundIndex}
              className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md transition-colors hover:bg-white/[0.06]"
            >
              <button
                onClick={() =>
                  setExpandedRound(isExpanded ? null : round.roundIndex)
                }
                aria-expanded={isExpanded}
                aria-controls={contentId}
                aria-label={`Toggle details for round ${round.roundIndex + 1}`}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <span className="w-6 text-center text-sm font-bold text-white/40">
                  {round.roundIndex + 1}
                </span>

                {round.albumImageUrl && (
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Image
                      src={round.albumImageUrl}
                      alt={round.trackName || 'Track'}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded object-cover"
                    />
                  </motion.div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {round.trackName || 'Unknown track'}
                  </p>
                  {round.artistName && (
                    <p className="truncate text-xs text-white/45">
                      {round.artistName}
                    </p>
                  )}
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-white/35" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={contentId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 border-t border-white/10 px-3 pb-3 pt-2">
                      {round.players.map((player) => (
                        <div
                          key={player.userId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white/75">
                              {player.displayName}
                            </span>
                            <span className="text-xs text-white/35">
                              {player.guessCount}{' '}
                              {player.guessCount === 1 ? 'guess' : 'guesses'}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              player.won
                                ? 'bg-[#1DB954]/20 text-[#1DB954]'
                                : 'bg-white/5 text-white/55'
                            }`}
                          >
                            {player.score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

export const RoundBreakdown = memo(RoundBreakdownBase);
