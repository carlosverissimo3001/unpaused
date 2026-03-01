import Image from 'next/image';
import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Music, Check, X } from 'lucide-react';
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
              className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md transition-colors hover:bg-white/[0.05]"
            >
              <button
                onClick={() =>
                  setExpandedRound(isExpanded ? null : round.roundIndex)
                }
                aria-expanded={isExpanded}
                aria-controls={contentId}
                aria-label={`Toggle details for round ${round.roundIndex + 1}`}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-white/50">
                  {round.roundIndex + 1}
                </span>

                {round.albumImageUrl && (
                  <Image
                    src={round.albumImageUrl}
                    alt={round.trackName || 'Track'}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover shadow-md"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {round.trackName || 'Unknown track'}
                  </p>
                  {round.artistName && (
                    <p className="truncate text-xs text-white/40">
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
                    <div className="space-y-2 border-t border-white/[0.06] px-3.5 pb-3.5 pt-3">
                      {round.players.map((player) => (
                        <div
                          key={player.userId}
                          className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2"
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              player.won ? 'bg-[#1DB954]/20' : 'bg-white/[0.06]'
                            }`}
                          >
                            {player.won ? (
                              <Check
                                className="h-3 w-3 text-[#1DB954]"
                                strokeWidth={3}
                              />
                            ) : (
                              <X
                                className="h-3 w-3 text-white/30"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="flex-1 truncate text-sm text-white/75">
                            {player.displayName}
                          </span>
                          <span className="text-[11px] text-white/30">
                            {player.guessCount}{' '}
                            {player.guessCount === 1 ? 'guess' : 'guesses'}
                          </span>
                          <span
                            className={`min-w-[3rem] text-right text-xs font-bold ${
                              player.won ? 'text-[#1DB954]' : 'text-white/40'
                            }`}
                          >
                            +{player.score}
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
