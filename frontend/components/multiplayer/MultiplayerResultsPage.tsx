'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, ChevronDown, Home, Music, Loader2 } from 'lucide-react';
import { useMultiplayerScoreboard } from '@/hooks/multiplayer/useMultiplayerScoreboard';
import { useMe } from '@/hooks/auth/useMe';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { triggerConfetti } from '@/components/game/confetti';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScoreboardPlayerTotalDto, ScoreboardRoundDto } from '@/sdk';

interface MultiplayerResultsPageProps {
  roomId: string;
}

type GameOutcome = 'won' | 'lost' | 'tied';

/* ─── Helpers ─────────────────────────────────────────────────── */

function deriveOutcome(
  sortedStandings: ScoreboardPlayerTotalDto[],
  myUserId: string | undefined,
): { outcome: GameOutcome; tiedPlayerNames: string[] } {
  if (!myUserId || sortedStandings.length === 0) {
    return { outcome: 'lost', tiedPlayerNames: [] };
  }

  const topScore = sortedStandings[0].totalScore;
  const tiedPlayers = sortedStandings.filter((p) => p.totalScore === topScore);
  const isTie = tiedPlayers.length > 1;
  const myStanding = sortedStandings.find((p) => p.userId === myUserId);
  const isAmongWinners = myStanding?.totalScore === topScore;

  if (isTie && isAmongWinners) {
    return {
      outcome: 'tied',
      tiedPlayerNames: tiedPlayers.map((p) => p.displayName),
    };
  }
  if (isAmongWinners) {
    return { outcome: 'won', tiedPlayerNames: [] };
  }
  return {
    outcome: 'lost',
    tiedPlayerNames: isTie ? tiedPlayers.map((p) => p.displayName) : [],
  };
}

/** Assign dense ranks (tied players share the same rank) */
function assignRanks(standings: ScoreboardPlayerTotalDto[]): number[] {
  const ranks: number[] = [];
  let currentRank = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i > 0 && standings[i].totalScore < standings[i - 1].totalScore) {
      currentRank = i + 1;
    }
    ranks.push(currentRank);
  }
  return ranks;
}

/* ─── Waiting for players ─────────────────────────────────────── */

function WaitingForPlayers() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex items-center justify-center"
      style={{ background: '#121212' }}
    >
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          opacity: [0.6, 1, 0.6],
          background: [
            `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.06) 0%, transparent 50%)`,
            `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.1) 0%, transparent 50%)`,
            `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.06) 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="text-center relative z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-block mb-4"
        >
          <Loader2 className="w-8 h-8 text-[#1DB954]" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">
          Waiting for other players
        </h2>
        <p className="text-white/40 text-sm">
          Results will appear once everyone finishes
        </p>
      </div>
    </div>
  );
}

/* ─── Header variants ─────────────────────────────────────────── */

function ResultsHeader({
  outcome,
  winner,
  tiedPlayerNames,
}: {
  outcome: GameOutcome;
  winner: ScoreboardPlayerTotalDto;
  tiedPlayerNames: string[];
}) {
  if (outcome === 'won') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-7 h-7 text-yellow-400" />
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            You Won!
          </h1>
          <Trophy className="w-7 h-7 text-yellow-400" />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/50"
        >
          <span className="text-yellow-400 font-semibold">
            {winner.totalScore}
          </span>{' '}
          points — well played!
        </motion.p>
      </motion.div>
    );
  }

  if (outcome === 'tied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-7 h-7 text-yellow-400" />
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            It&apos;s a Tie!
          </h1>
          <Trophy className="w-7 h-7 text-yellow-400" />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/50"
        >
          <span className="text-yellow-400 font-semibold">
            {tiedPlayerNames.join(' & ')}
          </span>{' '}
          tied with{' '}
          <span className="text-yellow-400 font-semibold">
            {winner.totalScore}
          </span>{' '}
          points
        </motion.p>
      </motion.div>
    );
  }

  // Loser — encouraging, softer tone
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 text-center"
    >
      <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
        Good Game!
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/40"
      >
        <span className="text-[#1DB954] font-semibold">
          {winner.displayName}
        </span>{' '}
        takes this one with{' '}
        <span className="text-[#1DB954] font-semibold">
          {winner.totalScore}
        </span>{' '}
        points
      </motion.p>
    </motion.div>
  );
}

/* ─── Standings list (ranked, with tie support) ───────────────── */

const RANK_STYLES: Record<
  number,
  { badge: string; ring: string; glow: string }
> = {
  1: {
    badge: 'bg-yellow-400 text-black',
    ring: 'ring-yellow-400 ring-[3px]',
    glow: 'shadow-lg shadow-yellow-400/20',
  },
  2: {
    badge: 'bg-gray-300 text-black',
    ring: 'ring-gray-300 ring-2',
    glow: '',
  },
  3: {
    badge: 'bg-amber-700 text-white',
    ring: 'ring-amber-700 ring-2',
    glow: '',
  },
};

function StandingsList({
  standings,
  ranks,
}: {
  standings: ScoreboardPlayerTotalDto[];
  ranks: number[];
}) {
  return (
    <div className="space-y-3 mb-8">
      {standings.map((player, idx) => {
        const rank = ranks[idx];
        const style = RANK_STYLES[rank];
        const isTopRank = rank === 1;

        return (
          <motion.div
            key={player.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15 + idx * 0.08,
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className={`flex items-center gap-4 p-4 rounded-xl relative overflow-hidden ${isTopRank ? 'py-5' : ''}`}
            style={{
              background: isTopRank
                ? 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(18,18,18,0.6) 60%)'
                : 'rgba(18, 18, 18, 0.5)',
              backdropFilter: 'blur(24px)',
              border: isTopRank
                ? '1px solid rgba(250,204,21,0.2)'
                : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Rank badge */}
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 ${
                style?.badge ?? 'bg-white/10 text-white/40'
              }`}
            >
              {rank}
            </div>

            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${
                style?.ring ?? 'ring-1 ring-white/10'
              } ${style?.glow ?? ''}`}
            >
              {player.avatarUrl ? (
                <Image
                  src={player.avatarUrl}
                  alt={player.displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/50 text-sm font-bold">
                    {player.displayName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name + crown */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p
                className={`font-semibold truncate ${isTopRank ? 'text-white text-base' : 'text-white/80 text-sm'}`}
              >
                {player.displayName}
              </p>
              {isTopRank && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.5,
                    type: 'spring',
                    stiffness: 300,
                  }}
                >
                  <Crown className="w-5 h-5 text-yellow-400 shrink-0" />
                </motion.div>
              )}
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
              <p
                className={`font-black tabular-nums ${isTopRank ? 'text-2xl text-yellow-400' : 'text-xl text-[#1DB954]'}`}
              >
                {player.totalScore}
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">
                pts
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Collapsible round breakdown ─────────────────────────────── */

function RoundBreakdown({ rounds }: { rounds: ScoreboardRoundDto[] }) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  if (rounds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="mb-8"
    >
      <h2 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
        <Music className="w-4 h-4" />
        Round Breakdown
      </h2>
      <div className="space-y-2">
        {rounds.map((round) => {
          const isExpanded = expandedRound === round.roundIndex;
          return (
            <div
              key={round.roundIndex}
              className="rounded-lg overflow-hidden"
              style={{
                background: 'rgba(18, 18, 18, 0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <button
                onClick={() =>
                  setExpandedRound(isExpanded ? null : round.roundIndex)
                }
                className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-sm font-bold text-white/40 w-6 text-center">
                  {round.roundIndex + 1}
                </span>
                {round.albumImageUrl && (
                  <Image
                    src={round.albumImageUrl}
                    alt={round.trackName || 'Track'}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded shrink-0 object-cover"
                  />
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {round.trackName || 'Unknown track'}
                  </p>
                  {round.artistName && (
                    <p className="text-xs text-white/40 truncate">
                      {round.artistName}
                    </p>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-2">
                      {round.players.map((player) => (
                        <div
                          key={player.userId}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white/70">
                              {player.displayName}
                            </span>
                            <span className="text-white/30 text-xs">
                              {player.guessCount}{' '}
                              {player.guessCount === 1 ? 'guess' : 'guesses'}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              player.won
                                ? 'bg-[#1DB954]/20 text-[#1DB954]'
                                : 'bg-white/5 text-white/50'
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
    </motion.div>
  );
}

/* ─── Background gradients ────────────────────────────────────── */

const BG_GRADIENTS: Record<GameOutcome, string[]> = {
  won: [
    `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(250,204,21,0.1) 0%, transparent 50%),
     radial-gradient(ellipse 80% 120% at 80% 100%, rgba(250,204,21,0.06) 0%, transparent 50%)`,
    `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(250,204,21,0.15) 0%, transparent 50%),
     radial-gradient(ellipse 90% 130% at 80% 100%, rgba(250,204,21,0.1) 0%, transparent 50%)`,
    `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(250,204,21,0.1) 0%, transparent 50%),
     radial-gradient(ellipse 80% 120% at 80% 100%, rgba(250,204,21,0.06) 0%, transparent 50%)`,
  ],
  tied: [
    `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(250,204,21,0.07) 0%, transparent 50%),
     radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29,185,84,0.06) 0%, transparent 50%)`,
    `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(250,204,21,0.1) 0%, transparent 50%),
     radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29,185,84,0.1) 0%, transparent 50%)`,
    `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(250,204,21,0.07) 0%, transparent 50%),
     radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29,185,84,0.06) 0%, transparent 50%)`,
  ],
  lost: [
    `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29,185,84,0.06) 0%, transparent 50%),
     radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29,185,84,0.04) 0%, transparent 50%)`,
    `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(29,185,84,0.09) 0%, transparent 50%),
     radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29,185,84,0.07) 0%, transparent 50%)`,
    `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29,185,84,0.06) 0%, transparent 50%),
     radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29,185,84,0.04) 0%, transparent 50%)`,
  ],
};

/* ─── Main component ──────────────────────────────────────────── */

export function MultiplayerResultsPage({
  roomId,
}: MultiplayerResultsPageProps) {
  const {
    data: scoreboard,
    isLoading,
    error,
  } = useMultiplayerScoreboard(roomId);
  const { data: me } = useMe();
  const { data: room } = useRoom(roomId);

  const isComplete = scoreboard?.isComplete ?? false;

  // Resolve current user's internal userId from the room player list
  const myInternalUserId = useMemo(() => {
    if (!me || !room) return undefined;
    const player = room.players.find(
      (p) => p.spotifyUserId === me.spotifyUserId,
    );
    return player?.userId;
  }, [me, room]);

  // Sort standings by score descending
  const sortedStandings = useMemo(
    () =>
      [...(scoreboard?.standings ?? [])].sort(
        (a, b) => b.totalScore - a.totalScore,
      ),
    [scoreboard?.standings],
  );

  const ranks = useMemo(() => assignRanks(sortedStandings), [sortedStandings]);

  const { outcome, tiedPlayerNames } = useMemo(
    () => deriveOutcome(sortedStandings, myInternalUserId),
    [sortedStandings, myInternalUserId],
  );

  const winner = sortedStandings[0];
  const shouldConfetti = outcome === 'won' || outcome === 'tied';

  // Fire confetti only for winners / tied players
  const confettiFired = useRef(false);
  useEffect(() => {
    if (isComplete && shouldConfetti && !confettiFired.current) {
      confettiFired.current = true;
      const timer = setTimeout(() => triggerConfetti(), 400);
      return () => clearTimeout(timer);
    }
  }, [isComplete, shouldConfetti]);

  if (isLoading) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center"
        style={{ background: '#121212' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !scoreboard) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center p-4"
        style={{ background: '#121212' }}
      >
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">Failed to load results</p>
          <Link href="/" className="text-[#1DB954] hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return <WaitingForPlayers />;
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-y-auto"
      style={{ background: '#121212' }}
    >
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          opacity: [0.6, 1, 0.6],
          background: BG_GRADIENTS[outcome],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col">
        <div className="max-w-xl mx-auto w-full">
          <ResultsHeader
            outcome={outcome}
            winner={winner}
            tiedPlayerNames={tiedPlayerNames}
          />

          <StandingsList standings={sortedStandings} ranks={ranks} />

          <RoundBreakdown rounds={scoreboard.rounds} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex justify-center mb-8"
          >
            <Link
              href="/"
              className="group flex items-center gap-2 px-8 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
