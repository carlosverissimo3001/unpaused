'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { triggerConfetti } from '@/components/game/confetti';
import { useMe } from '@/hooks/auth/useMe';
import { useMultiplayerScoreboard } from '@/hooks/multiplayer/useMultiplayerScoreboard';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { RoundBreakdown } from './RoundBreakdown';
import { ResultsHeader } from './ResultsHeader';
import { StandingsList } from './StandingsList';
import { WaitingForPlayers } from './WaitingForPlayers';
import { assignRanks, BG_GRADIENTS, deriveOutcome } from './results-utils';

interface ResultsContainerProps {
  roomId: string;
}

export function ResultsContainer({ roomId }: ResultsContainerProps) {
  const {
    data: scoreboard,
    isLoading,
    error,
  } = useMultiplayerScoreboard(roomId);
  const { data: me } = useMe();
  const { data: room } = useRoom(roomId);

  const isComplete = scoreboard?.isComplete ?? false;

  const currentUserId = useMemo(() => {
    if (!me || !room) {
      return undefined;
    }

    return room.players.find(
      (player) => player.spotifyUserId === me.spotifyUserId,
    )?.userId;
  }, [me, room]);

  const sortedStandings = useMemo(
    () =>
      [...(scoreboard?.standings ?? [])].sort(
        (left, right) => right.totalScore - left.totalScore,
      ),
    [scoreboard?.standings],
  );

  const ranks = useMemo(() => assignRanks(sortedStandings), [sortedStandings]);

  const { outcome, tiedPlayerNames } = useMemo(
    () => deriveOutcome(sortedStandings, currentUserId),
    [sortedStandings, currentUserId],
  );

  const winner = sortedStandings[0];
  const personalScore = useMemo(
    () =>
      sortedStandings.find((player) => player.userId === currentUserId)
        ?.totalScore,
    [sortedStandings, currentUserId],
  );

  const shouldConfetti = outcome === 'won' || outcome === 'tied';
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
        className="flex h-screen h-[100dvh] items-center justify-center"
        style={{ background: '#121212' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !scoreboard) {
    return (
      <div
        className="flex h-screen h-[100dvh] items-center justify-center p-4"
        style={{ background: '#121212' }}
      >
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-400">Failed to load results</p>
          <Link href="/" className="text-sm text-[#1DB954] hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return <WaitingForPlayers />;
  }

  if (!winner) {
    return null;
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-y-auto"
      style={{ background: '#121212' }}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        animate={{
          opacity: [0.6, 1, 0.6],
          background: BG_GRADIENTS[outcome],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex flex-col p-3 sm:p-6 md:p-8 lg:p-10">
        <div className="mx-auto w-full max-w-xl">
          <ResultsHeader
            outcome={outcome}
            winner={winner}
            tiedPlayerNames={tiedPlayerNames}
            personalScore={personalScore}
          />

          <StandingsList
            standings={sortedStandings}
            ranks={ranks}
            currentUserId={currentUserId}
          />

          <RoundBreakdown rounds={scoreboard.rounds} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <Link
              href="/"
              aria-label="Back to Home"
              className="group flex items-center gap-2 rounded-full bg-[#1DB954] px-8 py-3 font-bold text-black transition-colors hover:bg-[#1ed760]"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
