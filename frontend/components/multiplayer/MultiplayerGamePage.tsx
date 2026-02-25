'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RoundProgressBar } from '@/components/game/RoundProgressBar';
import { PlaySnippetButton } from '@/components/game/PlaySnippetButton';
import { SongRevealCard } from '@/components/game/SongRevealCard';
import { GuessHistoryList } from '@/components/game/GuessHistoryList';
import { GuessInput } from '@/components/game/GuessInput';
import { useGameAudio } from '@/hooks/game/useGameAudio';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { useMultiplayerRound } from '@/hooks/multiplayer/useMultiplayerRound';
import { useMultiplayerScoreboard } from '@/hooks/multiplayer/useMultiplayerScoreboard';
import { useSubmitMultiplayerGuess } from '@/hooks/multiplayer/useSubmitMultiplayerGuess';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useState, useMemo } from 'react';
import { useMe } from '@/hooks/auth/useMe';
import {
  MultiplayerRoundStateDtoStatusEnum,
  type MultiplayerRoundStateDto,
} from '@/sdk';
import { ChevronRight, Trophy } from 'lucide-react';

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

interface MultiplayerGamePageProps {
  roomId: string;
}

/* ─── Round progress dots ─────────────────────────────────────── */

function RoundDots({
  roundState,
  pastResults,
}: {
  roundState: MultiplayerRoundStateDto;
  /** won/lost for each past round index, derived from the scoreboard */
  pastResults: Map<number, boolean>;
}) {
  const total = roundState.totalRounds;
  const current = roundState.roundIndex;
  const isCurrentComplete =
    roundState.status !== MultiplayerRoundStateDtoStatusEnum.Playing;

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current;
        const isCompleted = i < current || (isCurrent && isCurrentComplete);

        let dotColor = 'bg-white/20'; // upcoming
        if (isCompleted) {
          const won = isCurrent
            ? roundState.status === MultiplayerRoundStateDtoStatusEnum.Won
            : (pastResults.get(i) ?? false);
          dotColor = won ? 'bg-[#1DB954]' : 'bg-red-500';
        }

        return (
          <motion.div
            key={i}
            className={`rounded-full ${isCurrent ? 'w-3 h-3' : 'w-2.5 h-2.5'} ${dotColor}`}
            {...(isCurrent &&
              !isCurrentComplete && {
                animate: {
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    '0 0 0px rgba(29,185,84,0.4)',
                    '0 0 10px rgba(29,185,84,0.8)',
                    '0 0 0px rgba(29,185,84,0.4)',
                  ],
                },
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              })}
          />
        );
      })}
    </div>
  );
}

/* ─── Mini-scoreboard shown between rounds ────────────────────── */

function RoundScoreSummary({
  roomId,
  roundIndex,
  myUserId,
}: {
  roomId: string;
  roundIndex: number;
  myUserId: string | undefined;
}) {
  const { data: scoreboard } = useMultiplayerScoreboard(roomId);

  const roundData = scoreboard?.rounds.find((r) => r.roundIndex === roundIndex);
  const myRoundResult = roundData?.players.find((p) => p.userId === myUserId);

  if (!myRoundResult) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      className="mt-5 p-4 rounded-xl text-center"
      style={{
        background: 'rgba(18, 18, 18, 0.5)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-sm text-white/50 mb-1">Your score this round</p>
      <p className="text-3xl font-black text-[#1DB954] tabular-nums">
        +{myRoundResult.score}
      </p>
      <p className="text-xs text-white/30 mt-1">
        {myRoundResult.guessCount}{' '}
        {myRoundResult.guessCount === 1 ? 'guess' : 'guesses'}
      </p>
    </motion.div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */

export function MultiplayerGamePage({ roomId }: MultiplayerGamePageProps) {
  const router = useRouter();
  const submitGuessMutation = useSubmitMultiplayerGuess();
  const spotifySearch = useSpotifyTrackSearch();
  const {
    data: roundState,
    isLoading: roundLoading,
    error: roundError,
    advanceRound,
  } = useMultiplayerRound(roomId);
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: me } = useMe();
  const { data: scoreboard } = useMultiplayerScoreboard(roomId);

  const [transitionKey, setTransitionKey] = useState(0);

  const isLoading = roundLoading || roomLoading;
  const error = roundError;

  // Resolve current user's internal userId from the room player list
  const myInternalUserId = useMemo(() => {
    if (!me || !room) return undefined;
    const player = room.players.find(
      (p) => p.spotifyUserId === me.spotifyUserId,
    );
    return player?.userId;
  }, [me, room]);

  const isRoundComplete =
    roundState?.status !== MultiplayerRoundStateDtoStatusEnum.Playing;
  const isGameOver =
    roundState &&
    roundState.roundIndex === roundState.totalRounds - 1 &&
    isRoundComplete;

  // Derive past round results from scoreboard for the round dots
  const pastResults = useMemo(() => {
    const map = new Map<number, boolean>();
    if (!scoreboard || !myInternalUserId) return map;
    for (const round of scoreboard.rounds) {
      const myResult = round.players.find((p) => p.userId === myInternalUserId);
      if (myResult) map.set(round.roundIndex, myResult.won);
    }
    return map;
  }, [scoreboard, myInternalUserId]);

  const gameAudio = useGameAudio({
    previewUrl: roundState?.previewUrl,
    isGameOver: !!isRoundComplete,
    currentRound: roundState?.currentGuess ?? 0,
  });

  const {
    audioRef,
    fullAudioRef,
    isPlaying,
    amplitude,
    playSnippet,
    pauseSnippet,
  } = gameAudio;

  const albumArtColor = useImageColor(
    isRoundComplete && roundState?.answer?.albumImageUrl
      ? roundState.answer.albumImageUrl
      : null,
  );

  const handleSubmit = useCallback(() => {
    if (!roundState || submitGuessMutation.isPending) return;
    if (!spotifySearch.selectedTrack) return;

    submitGuessMutation.mutate(
      {
        roomId,
        guess: {
          trackId: spotifySearch.selectedTrack.id,
          trackName: spotifySearch.selectedTrack.name,
          artistName: spotifySearch.selectedTrack.artist,
          albumName: spotifySearch.selectedTrack.albumName,
          skip: false,
        },
      },
      { onSuccess: () => spotifySearch.handleClearSelection() },
    );
  }, [roundState, submitGuessMutation, spotifySearch, roomId]);

  const handleSkip = useCallback(() => {
    if (!roundState || submitGuessMutation.isPending) return;
    submitGuessMutation.mutate({
      roomId,
      guess: { skip: true },
    });
  }, [roundState, submitGuessMutation, roomId]);

  const handleNextRound = useCallback(() => {
    setTransitionKey((k) => k + 1);
    advanceRound();
  }, [advanceRound]);

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

  if (error || !roundState) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center p-4 sm:p-6"
        style={{ background: '#121212' }}
      >
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load game'}
          </p>
          <Link
            href={`/multiplayer/${roomId}`}
            className="text-[#1DB954] hover:underline text-sm"
          >
            Back to Lobby
          </Link>
        </div>
      </div>
    );
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
          background: [
            `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
            `radial-gradient(ellipse 130% 90% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 90% 90% at 20% 80%, rgba(29, 185, 84, 0.08) 0%, transparent 45%)`,
            `radial-gradient(ellipse 120% 80% at 50% 0%, ${albumArtColor} 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 45%)`,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        variants={SHAKE_VARIANTS}
        animate={false}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col min-h-screen min-h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-0">
          {/* Round dots */}
          <RoundDots roundState={roundState} pastResults={pastResults} />

          {/* Round title */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Round {roundState.roundIndex + 1}{' '}
              <span className="text-white/30 font-normal">
                / {roundState.totalRounds}
              </span>
            </h2>
          </div>

          <audio
            ref={audioRef}
            src={roundState.previewUrl ?? undefined}
            preload="auto"
            crossOrigin="anonymous"
          />
          {isRoundComplete && roundState.previewUrl && (
            <audio
              ref={fullAudioRef}
              src={roundState.previewUrl}
              preload="auto"
              loop={false}
            />
          )}

          {!isRoundComplete && (
            <RoundProgressBar
              currentRound={roundState.currentGuess}
              guesses={roundState.guesses}
            />
          )}

          {!isRoundComplete && (
            <PlaySnippetButton
              currentRound={roundState.currentGuess}
              isPlaying={isPlaying}
              amplitude={amplitude}
              onPlay={playSnippet}
              onPause={pauseSnippet}
            />
          )}

          <AnimatePresence mode="wait">
            {isRoundComplete ? (
              <motion.div
                key={`reveal-${transitionKey}`}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1"
              >
                <SongRevealCard
                  status={roundState.status}
                  answer={roundState.answer}
                  guesses={roundState.guesses}
                  previewUrl={roundState.previewUrl}
                  shareGameId={null}
                  showViewStats={false}
                  showPlayAgain={false}
                  isFullSongPlaying={gameAudio.isFullSongPlaying}
                  isMuted={gameAudio.isMuted}
                  onToggleFullSong={gameAudio.toggleFullSong}
                  onToggleMute={gameAudio.toggleMute}
                />

                {/* Player's own score for this round */}
                <RoundScoreSummary
                  roomId={roomId}
                  roundIndex={roundState.roundIndex}
                  myUserId={myInternalUserId}
                />

                {/* Next Round / View Results */}
                <div className="mt-6 flex justify-center">
                  {isGameOver ? (
                    <motion.button
                      onClick={() =>
                        router.push(`/multiplayer/${roomId}/results`)
                      }
                      className="group flex items-center gap-2 px-8 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-colors"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Trophy className="w-5 h-5" />
                      View Results
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleNextRound}
                      className="group flex items-center gap-2 px-8 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-colors"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Next Round
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`guess-${transitionKey}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <GuessInput
                  search={spotifySearch}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  submitPending={submitGuessMutation.isPending}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <GuessHistoryList
            guesses={roundState.guesses}
            isGameOver={!!isRoundComplete}
          />
        </div>
      </motion.div>
    </div>
  );
}
