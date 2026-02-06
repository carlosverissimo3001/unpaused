"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGameOrchestrator } from "@/hooks/game/useGameOrchestrator";
import { useAlbumArtColor } from "@/hooks/misc/useAlbumArtColor";
import { RoundProgressBar } from "./RoundProgressBar";
import { PlaySnippetButton } from "./PlaySnippetButton";
import { SongRevealCard } from "./SongRevealCard";
import { GuessHistoryList } from "./GuessHistoryList";
import { GameHeader } from "./GameHeader";
import { GameTitle } from "./GameTitle";
import { GuessInput } from "./GuessInput";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";

const SHAKE_VARIANTS: Variants = {
  shake: {
    x: [0, -12, 12, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface GamePageProps {
  mode: GameMode;
  playlistId?: string;
}

export function GamePage({ mode, playlistId }: GamePageProps) {
  const router = useRouter();
  const {
    playlist,
    gameState,
    stats,
    isLoading,
    error,
    isGameOver,
    isPlaylist,
    isDaily,
    submitPending,
    shouldShake,
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
    handlePlayAgain,
  } = useGameOrchestrator(mode, playlistId);

  // Destructure gameAudio to avoid ref access warnings
  const {
    audioRef,
    fullAudioRef,
    isPlaying,
    amplitude,
    playSnippet,
    pauseSnippet,
  } = gameAudio;

  const albumArtColor = useAlbumArtColor(
    isGameOver && gameState?.answer?.albumImageUrl ? gameState.answer.albumImageUrl : null
  );

  if (isLoading) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center"
        style={{ background: "#121212" }}
      >
        <motion.div
          className="rounded-full h-14 w-14 border-2 border-[#1DB954] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center p-4 sm:p-6"
        style={{ background: "#121212" }}
      >
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-[#1DB954] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }


  return (
    <div className="h-screen h-[100dvh] overflow-hidden" style={{ background: "#121212" }}>
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
          ease: "easeInOut",
        }}
      />

      <motion.div
        variants={SHAKE_VARIANTS}
        animate={shouldShake ? "shake" : ""}
        className="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 flex flex-col h-screen h-[100dvh] safe-area-inset"
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-0">
          <GameHeader mode={mode} playlist={playlist ?? null} stats={stats ?? null} />

          <GameTitle mode={mode} currentRound={gameState.currentRound} isGameOver={!!isGameOver} />

          <audio ref={audioRef} src={gameState.previewUrl ?? undefined} preload="auto" crossOrigin="anonymous" />
          {isGameOver && gameState.previewUrl && (
            <audio
              ref={fullAudioRef}
              src={gameState.previewUrl}
              preload="auto"
              loop={false}
            />
          )}

          <RoundProgressBar
            currentRound={gameState.currentRound}
            guesses={gameState.guesses}
            isGameOver={!!isGameOver}
          />

          {!isGameOver && (
            <PlaySnippetButton
              currentRound={gameState.currentRound}
              isPlaying={isPlaying}
              amplitude={amplitude}
              onPlay={playSnippet}
              onPause={pauseSnippet}
            />
          )}

          {/* Shared layout for seamless GuessInput ↔ SongRevealCard transition */}
          <AnimatePresence mode="wait">
            {isGameOver ? (
              <motion.div
                key="reveal"
                layoutId="game-console-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1"
              >
                <SongRevealCard
                  status={gameState.status}
                  answer={gameState.answer}
                  guesses={gameState.guesses}
                  previewUrl={gameState.previewUrl}
                  shareGameId={isDaily ? gameState.sessionId : null}
                  showViewStats={isDaily}
                  showPlayAgain={isPlaylist}
                  onPlayAgain={isPlaylist ? handlePlayAgain : undefined}
                  playlistExternalUrl={isPlaylist && playlist ? playlist.externalUrl : null}
                  playlistName={isPlaylist && playlist ? playlist.name : null}
                  playlistTotalTracks={isPlaylist && playlist ? playlist.totalTracks : null}
                  playlistImageUrl={isPlaylist && playlist ? playlist.imageUrl ?? null : null}
                  isFullSongPlaying={gameAudio.isFullSongPlaying}
                  isMuted={gameAudio.isMuted}
                  onToggleFullSong={gameAudio.toggleFullSong}
                  onToggleMute={gameAudio.toggleMute}
                  rankTitle={gameState.rankTitle ?? null}
                  specialNote={gameState.specialNote ?? null}
                  meta={gameState.meta ?? null}
                />
              </motion.div>
            ) : (
              <motion.div
                key="guess"
                layoutId="game-console-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex-1"
              >
                <GuessInput
                  search={spotifySearch}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  submitPending={submitPending}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isPlaylist && isGameOver && (
            <div className="flex gap-4 justify-center mt-6">
              <motion.button
                type="button"
                onClick={() => router.push("/")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-full font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
              >
                Home
              </motion.button>
            </div>
          )}

          <GuessHistoryList guesses={gameState.guesses} isGameOver={!!isGameOver} />
        </div>
      </motion.div>
    </div>
  );
}
