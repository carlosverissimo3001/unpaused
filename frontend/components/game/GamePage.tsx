"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGameOrchestrator } from "@/hooks/game/useGameOrchestrator";
import { RoundProgressBar } from "./RoundProgressBar";
import { PlaySnippetButton } from "./PlaySnippetButton";
import { SongRevealCard } from "./SongRevealCard";
import { GuessHistoryList } from "./GuessHistoryList";
import { GameHeader } from "./GameHeader";
import { GameTitle } from "./GameTitle";
import { GuessInput } from "./GuessInput";
import type { GameMode } from "./types";

function getColorFromImage(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "rgba(30, 215, 96, 0.05)";
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = imageUrl.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsla(${hue}, 30%, 20%, 0.08)`;
}

const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
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

  const ambientColor = playlist ? getColorFromImage(playlist.imageUrl) : "rgba(30, 215, 96, 0.05)";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-spotify-green hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="min-h-screen overflow-hidden">
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at top, ${ambientColor} 0%, transparent 50%)`,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.div
        variants={shakeVariants}
        animate={shouldShake ? "shake" : ""}
        className="p-6 md:p-8 relative z-10"
      >
        <div className="max-w-2xl mx-auto">
          <GameHeader mode={mode} playlist={playlist ?? null} stats={stats ?? null} />

          <GameTitle
            mode={mode}
            currentRound={gameState.currentRound}
            isGameOver={!!isGameOver}
          />

          <audio ref={gameAudio.audioRef} src={gameState.previewUrl ?? undefined} preload="auto" />
          {isGameOver && gameState.previewUrl && (
            <audio
              ref={gameAudio.fullAudioRef}
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
              isPlaying={gameAudio.isPlaying}
              onPlay={gameAudio.playSnippet}
            />
          )}

          {isGameOver && (
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
            />
          )}

          {!isGameOver && (
            <GuessInput
              search={spotifySearch}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
              submitPending={submitPending}
            />
          )}

          {isPlaylist && isGameOver && (
            <div className="flex gap-4 justify-center mt-6">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-full transition-all"
              >
                Home
              </button>
            </div>
          )}

          <GuessHistoryList guesses={gameState.guesses} />
        </div>
      </motion.div>
    </div>
  );
}
