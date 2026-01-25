"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Search, X, ArrowLeft, Play, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameStateDtoStatusEnum } from "@/sdk/models/GameStateDto";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";
import { useStartGame } from "@/hooks/useStartGame";
import { useGameState } from "@/hooks/useGameState";
import { useSubmitGuess } from "@/hooks/useSubmitGuess";
import { useTrackSearch } from "@/hooks/useTrackSearch";
import { usePlaylistById } from "@/hooks/usePlaylistById";
import { queryKeys } from "@/lib/queryKeys";
import confetti from "canvas-confetti";

const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];

// Screen shake animation variant
const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Extract muted color from playlist image
function getColorFromImage(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "rgba(30, 215, 96, 0.05)"; // Default Spotify green
  
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = imageUrl.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  const saturation = 30 + (Math.abs(hash) % 20); // 30-50% (muted)
  const lightness = 15 + (Math.abs(hash) % 10); // 15-25% (dark)
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.08)`;
}

// Confetti burst function
const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: NodeJS.Timeout = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastGuessResult, setLastGuessResult] = useState<GuessHistoryDtoResultEnum | null>(null);

  const playlistId = params.playlistId as string;
  const queryClient = useQueryClient();

  // Fetch playlist data for breadcrumb
  const { data: playlist } = usePlaylistById(playlistId);

  // Start game mutation
  const startGameMutation = useStartGame();

  // Get game state (only after game has started)
  const { data: gameState, isLoading: isLoadingState, error: gameStateError } = useGameState(
    startGameMutation.data?.sessionId
  );

  // Submit guess mutation
  const submitGuessMutation = useSubmitGuess();

  // Get trackOptions - they're preserved in cache by useGameState and useSubmitGuess
  // Fallback to startGame data if gameState hasn't loaded yet
  const trackOptions = gameState?.trackOptions || startGameMutation.data?.trackOptions || [];

  // Track search UI state
  const {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    selectedTrack,
    filteredTracks,
    searchRef,
    handleSelectTrack,
    handleClearSelection,
  } = useTrackSearch(trackOptions);


  // Get ambient color from playlist image
  const ambientColor = playlist ? getColorFromImage(playlist.imageUrl) : "rgba(30, 215, 96, 0.05)";

  // Start game on mount
  useEffect(() => {
    if (playlistId && !startGameMutation.data && !startGameMutation.isPending) {
      startGameMutation.mutate(playlistId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  // Track guess results for feedback
  useEffect(() => {
    if (gameState?.guesses && gameState.guesses.length > 0) {
      const lastGuess = gameState.guesses[gameState.guesses.length - 1];
      if (lastGuess.result !== lastGuessResult) {
        setLastGuessResult(lastGuess.result);
        
        if (lastGuess.result === GuessHistoryDtoResultEnum.Correct) {
          triggerConfetti();
        }
      }
    }
  }, [gameState?.guesses, lastGuessResult]);

  // Play audio snippet
  const playSnippet = () => {
    if (!audioRef.current || !gameState) return;

    const duration = ROUND_DURATIONS[gameState.currentRound] * 1000;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);

    const timeoutId = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  };

  // Handle submit guess
  const handleSubmit = () => {
    if (!gameState || !selectedTrack || submitGuessMutation.isPending) return;

    submitGuessMutation.mutate(
      {
        sessionId: gameState.sessionId,
        trackId: selectedTrack.id,
        skip: false,
      },
      {
        onSuccess: () => {
          handleClearSelection();
        },
      }
    );
  };

  // Handle skip
  const handleSkip = () => {
    if (!gameState || submitGuessMutation.isPending) return;

    submitGuessMutation.mutate({
      sessionId: gameState.sessionId,
      trackId: null,
      skip: true,
    });
  };

  // Loading state
  const isLoading = startGameMutation.isPending || isLoadingState;
  const error = startGameMutation.error || gameStateError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-spotify-green hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const isGameOver = gameState.status !== GameStateDtoStatusEnum.Playing;
  const shouldShake = lastGuessResult === GuessHistoryDtoResultEnum.Wrong;

  // Split round text for staggered animation
  // Cap currentRound display at MAX_ROUNDS to prevent "Round 7 of 6"
  const displayRound = Math.min(gameState.currentRound + 1, ROUND_DURATIONS.length);
  const roundText = `Round ${displayRound}`;
  const ofText = "of";
  const totalText = `${ROUND_DURATIONS.length}`;

  return (
    <motion.div
      variants={shakeVariants as Variants}
      animate={shouldShake ? "shake" : ""}
      className="min-h-screen p-8 relative overflow-hidden"
    >
      {/* Dynamic Ambient Background */}
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at top, ${ambientColor} 0%, transparent 50%)`,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>

          {playlist && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2.5 ml-2"
            >
              {/* Playlist Thumbnail */}
              <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                {playlist.imageUrl ? (
                  <Image
                    src={playlist.imageUrl}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white/40" />
                  </div>
                )}
              </div>
              
              {/* Playlist Name - Muted Link */}
              <a
                href={playlist.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5 group"
              >
                <span className="truncate max-w-[200px]">{playlist.name}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </motion.div>
          )}
        </div>

        {/* Header with Staggered Animation */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Guess the Song</h1>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <motion.span
              key={`round-${gameState.currentRound}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0 }}
              className="text-lg font-semibold"
            >
              {roundText}
            </motion.span>
            <motion.span
              key={`of-${gameState.currentRound}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {ofText}
            </motion.span>
            <motion.span
              key={`total-${gameState.currentRound}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-lg font-semibold"
            >
              {totalText}
            </motion.span>
          </div>
        </div>

        {/* Audio Player */}
        <audio ref={audioRef} src={gameState.previewUrl as string} preload="auto" />

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {ROUND_DURATIONS.map((duration, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                index < gameState.currentRound
                  ? gameState.guesses[index]?.result === GuessHistoryDtoResultEnum.Correct
                    ? "bg-green-500"
                    : gameState.guesses[index]?.result === GuessHistoryDtoResultEnum.Artist
                    ? "bg-yellow-500"
                    : "bg-red-500"
                  : index === gameState.currentRound
                  ? "bg-spotify-green"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Play Button with Breathing Glow */}
        {!isGameOver && (
          <div className="text-center mb-8">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(30, 215, 96, 0.3)",
                  "0 0 40px rgba(30, 215, 96, 0.5)",
                  "0 0 20px rgba(30, 215, 96, 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block rounded-full"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playSnippet}
                disabled={isPlaying}
                className="bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 text-black font-bold py-4 px-8 rounded-full text-lg transition-all relative z-10"
              >
                {isPlaying ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                    </motion.span>
                    Playing {ROUND_DURATIONS[gameState.currentRound]}s...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-5 h-5" fill="currentColor" />
                    Play {ROUND_DURATIONS[gameState.currentRound]}s Snippet
                  </span>
                )}
              </motion.button>
            </motion.div>
          </div>
        )}

        {/* Game Over State */}
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-8 p-8 bg-white/10 rounded-xl"
          >
            <h2 className="text-2xl font-bold mb-4">
              {gameState.status === GameStateDtoStatusEnum.Won ? "You Won!" : "Game Over"}
            </h2>
            {gameState.answer && (
              <div className="mb-6">
                {/* Album Image */}
                {gameState.answer.albumImageUrl && (
                  <div className="relative w-40 h-40 mx-auto mb-4 rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={gameState.answer.albumImageUrl}
                      alt={gameState.answer.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                )}
                <p className="text-gray-400 mb-2">The song was:</p>
                <p className="text-xl font-semibold">{gameState.answer.name}</p>
                <p className="text-gray-400">by {gameState.answer.artist}</p>
              </div>
            )}
            
            {/* Enhanced Playlist Info on Game Over */}
            {playlist && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <p className="text-sm text-white/50 mb-3">Listen to the full playlist:</p>
                <a
                  href={playlist.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group"
                >
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                    {playlist.imageUrl ? (
                      <Image
                        src={playlist.imageUrl}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{playlist.name}</p>
                    <p className="text-xs text-white/60">{playlist.totalTracks} tracks</p>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </motion.div>
            )}

            <div className="flex gap-4 justify-center mt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Clear the old game state from cache
                  if (gameState?.sessionId) {
                    queryClient.removeQueries({
                      queryKey: queryKeys.game.state(gameState.sessionId),
                    });
                  }
                  // Reset the mutation and start a new game
                  startGameMutation.reset();
                  startGameMutation.mutate(playlistId);
                }}
                disabled={startGameMutation.isPending}
                className="bg-spotify-green hover:bg-green-400 text-black font-bold py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startGameMutation.isPending ? "Starting..." : "Play Again"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/")}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-full transition-all"
              >
                Home
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Track Search */}
        {!isGameOver && (
          <div className="mb-8">
            {/* Selected Track Display */}
            {selectedTrack ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-spotify-green text-black rounded-lg mb-4"
              >
                <div className="flex-1">
                  <p className="font-medium">{selectedTrack.name}</p>
                  <p className="text-sm text-black/70">{selectedTrack.artist}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClearSelection}
                  className="p-2 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ) : (
              /* Search Input */
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search for a song..."
                    className="w-full pl-12 pr-4 py-4 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  />
                </div>

                {/* Dropdown Results */}
                <AnimatePresence>
                  {showDropdown && searchQuery.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-zinc-800 rounded-lg shadow-xl border border-white/10 max-h-80 overflow-y-auto"
                    >
                      {filteredTracks.length > 0 ? (
                        filteredTracks.map((track) => (
                          <motion.button
                            key={track.id}
                            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            onClick={() => handleSelectTrack(track)}
                            className="w-full p-4 text-left transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <p className="font-medium text-white">{track.name}</p>
                            <p className="text-sm text-gray-400">{track.artist}</p>
                          </motion.button>
                        ))
                      ) : (
                        <div className="p-4 text-gray-400 text-center">
                          {gameState?.trackOptions && gameState.trackOptions.length > 0
                            ? "No songs found"
                            : "Loading tracks..."}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isGameOver && (
          <div className="flex gap-4">
            {/* Skip Button - Ghost Style */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleSkip}
              disabled={submitGuessMutation.isPending}
              className="flex-1 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 disabled:border-white/10 disabled:bg-transparent text-white font-bold py-3 px-6 rounded-full transition-all"
            >
              Skip
            </motion.button>
            
            {/* Submit Button - Only Green when Track Selected */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: selectedTrack ? 1.02 : 1 }}
              onClick={handleSubmit}
              disabled={!selectedTrack || submitGuessMutation.isPending}
              className={`flex-1 font-bold py-3 px-6 rounded-full transition-all ${
                selectedTrack
                  ? "bg-spotify-green hover:bg-green-400 text-black"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              Submit
            </motion.button>
          </div>
        )}

        {/* Guess History */}
        <AnimatePresence>
          {gameState.guesses?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <h3 className="text-lg font-semibold mb-4">Previous Guesses</h3>
              <div className="space-y-2">
                {gameState.guesses.map((guess, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${
                      guess.result === GuessHistoryDtoResultEnum.Correct
                        ? "bg-green-500/20 border border-green-500/50"
                        : guess.result === GuessHistoryDtoResultEnum.Artist
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : guess.result === GuessHistoryDtoResultEnum.Skip
                        ? "bg-gray-500/20 border border-gray-500/50"
                        : "bg-red-500/20 border border-red-500/50"
                    }`}
                  >
                    <p className="font-medium">
                      {guess.result === GuessHistoryDtoResultEnum.Skip
                        ? "Skipped"
                        : guess.trackName}
                    </p>
                    {guess.result !== GuessHistoryDtoResultEnum.Skip && (
                      <p className="text-sm text-gray-400">{guess.artistName}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
