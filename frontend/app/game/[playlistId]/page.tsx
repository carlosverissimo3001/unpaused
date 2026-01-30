"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Search, X, ArrowLeft, Play, ExternalLink, Volume2, VolumeX, Pause, Disc3 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameStateDtoStatusEnum } from "@/sdk/models/GameStateDto";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";
import { useStartGame } from "@/hooks/useStartGame";
import { useGameState } from "@/hooks/useGameState";
import { useSubmitGuess } from "@/hooks/useSubmitGuess";
import { useSpotifyTrackSearch } from "@/hooks/useSpotifyTrackSearch";
import { usePlaylistById } from "@/hooks/usePlaylistById";
import { useMediaSession } from "@/hooks/useMediaSession";
import { queryKeys } from "@/lib/queryKeys";
import confetti from "canvas-confetti";

const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];

// Shared styles for guess results (progress bar + guess history badges)
const GUESS_RESULT_STYLE: Record<
  GuessHistoryDtoResultEnum,
  { label: string; barClass: string; cardClass: string; badgeClass: string }
> = {
  [GuessHistoryDtoResultEnum.Correct]: {
    label: "Correct",
    barClass: "bg-green-500",
    cardClass: "bg-green-500/20 border-green-500/50",
    badgeClass: "bg-green-500/30 text-green-300 border-green-500/60",
  },
  [GuessHistoryDtoResultEnum.Artist]: {
    label: "Same artist",
    barClass: "bg-yellow-500",
    cardClass: "bg-yellow-500/20 border-yellow-500/50",
    badgeClass: "bg-yellow-500/30 text-yellow-200 border-yellow-500/60",
  },
  [GuessHistoryDtoResultEnum.Album]: {
    label: "Same album",
    barClass: "bg-amber-500",
    cardClass: "bg-amber-500/20 border-amber-500/50",
    badgeClass: "bg-amber-500/30 text-amber-200 border-amber-500/60",
  },
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: {
    label: "Same artist & album",
    barClass: "bg-orange-500",
    cardClass: "bg-orange-500/20 border-orange-500/50",
    badgeClass: "bg-orange-500/30 text-orange-200 border-orange-500/60",
  },
  [GuessHistoryDtoResultEnum.Wrong]: {
    label: "Wrong",
    barClass: "bg-red-500",
    cardClass: "bg-red-500/20 border-red-500/50",
    badgeClass: "bg-red-500/30 text-red-200 border-red-500/60",
  },
  [GuessHistoryDtoResultEnum.Skip]: {
    label: "Skipped",
    barClass: "bg-gray-500",
    cardClass: "bg-gray-500/20 border-gray-500/50",
    badgeClass: "bg-gray-500/30 text-gray-300 border-gray-500/60",
  },
};

function getGuessResultStyle(result: GuessHistoryDtoResultEnum) {
  return GUESS_RESULT_STYLE[result];
}

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
  const fullAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullSongPlaying, setIsFullSongPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

  // Track search via Spotify API (SDK)
  const {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    selectedTrack,
    filteredTracks,
    isLoading: isSearchLoading,
    searchRef,
    handleSelectTrack,
    handleClearSelection,
  } = useSpotifyTrackSearch();


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

  // Auto-play full song when game ends
  useEffect(() => {
    const isGameOver = gameState?.status !== GameStateDtoStatusEnum.Playing;
    if (isGameOver && gameState?.previewUrl && fullAudioRef.current) {
      // Stop any snippet playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
      
      // Play the full song
      const audio = fullAudioRef.current;
      audio.currentTime = 0;
      audio.play()
        .then(() => {
          setIsFullSongPlaying(true);
        })
        .catch((err) => {
          console.error("Failed to auto-play:", err);
          setIsFullSongPlaying(false);
          // Auto-play might be blocked by browser, that's okay
        });
    }
  }, [gameState?.status, gameState?.previewUrl]);

  // Handle full song audio events - only set up when game is over and audio exists
  useEffect(() => {
    const isGameOver = gameState?.status !== GameStateDtoStatusEnum.Playing;
    if (!isGameOver || !gameState?.previewUrl) {
      return;
    }

    const audio = fullAudioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsFullSongPlaying(true);
    };
    const handlePause = () => {
      setIsFullSongPlaying(false);
    };
    const handleEnded = () => {
      setIsFullSongPlaying(false);
    };

    // Sync state with actual audio state
    setIsFullSongPlaying(!audio.paused);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [gameState?.status, gameState?.previewUrl]);

  // Toggle full song playback
  const toggleFullSong = () => {
    const audio = fullAudioRef.current;
    if (!audio) return;
    
    if (audio.paused) {
      audio.play()
        .then(() => {
          setIsFullSongPlaying(true);
        })
        .catch((err) => {
          console.error("Failed to play:", err);
          setIsFullSongPlaying(false);
        });
    } else {
      audio.pause();
      setIsFullSongPlaying(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!fullAudioRef.current) return;
    fullAudioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

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

  // Media Session API integration
  // Switch between snippet and full song based on game state
  // Compute isGameOver inline to avoid dependency issues
  const gameIsOver = gameState?.status !== GameStateDtoStatusEnum.Playing;
  const activeAudioElement = gameIsOver ? fullAudioRef.current : audioRef.current;
  
  useMediaSession({
    audioElement: activeAudioElement,
    metadata: gameIsOver && gameState?.answer
      ? {
          // Full song metadata (game over)
          title: gameState.answer.name,
          artist: gameState.answer.artist,
          album: playlist?.name || "Unpaused",
          artwork: gameState.answer.albumImageUrl
            ? [
                {
                  src: gameState.answer.albumImageUrl,
                  sizes: "512x512",
                  type: "image/jpeg",
                },
              ]
            : playlist?.imageUrl
            ? [
                {
                  src: playlist.imageUrl,
                  sizes: "512x512",
                  type: "image/jpeg",
                },
              ]
            : [],
        }
      : gameState && playlist
      ? {
          // Snippet metadata (during gameplay)
          title: "Guess the Song",
          artist: playlist.name,
          album: "Unpaused Game",
          artwork: playlist.imageUrl
            ? [
                {
                  src: playlist.imageUrl,
                  sizes: "512x512",
                  type: "image/jpeg",
                },
              ]
            : [],
        }
      : undefined,
    onPlay: () => {
      if (gameIsOver) {
        // Full song playback
        if (fullAudioRef.current && fullAudioRef.current.paused) {
          fullAudioRef.current.play().catch((err) => {
            console.error("Failed to play via media session:", err);
          });
        }
      } else {
        // Snippet playback
        if (!isPlaying && audioRef.current) {
          playSnippet();
        }
      }
    },
    onPause: () => {
      if (gameIsOver) {
        // Full song pause
        if (fullAudioRef.current && !fullAudioRef.current.paused) {
          fullAudioRef.current.pause();
        }
      } else {
        // Snippet pause
        if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    },
  });

  // Handle submit guess
  const handleSubmit = () => {
    if (!gameState || !selectedTrack || submitGuessMutation.isPending) return;

    submitGuessMutation.mutate(
      {
        sessionId: gameState.sessionId,
        trackId: selectedTrack.id,
        skip: false,
        trackName: selectedTrack.name,
        artistName: selectedTrack.artist,
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

  // When playing: currentRound is 0-based (round 1 = 0). When game over: currentRound is the round they just completed (1-based display).
  const displayRound = isGameOver
    ? gameState.currentRound
    : Math.min(gameState.currentRound + 1, ROUND_DURATIONS.length);
  const roundText = `Round ${displayRound}`;
  const ofText = "of";
  const totalText = `${ROUND_DURATIONS.length}`;

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Dynamic Ambient Background */}
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at top, ${ambientColor} 0%, transparent 50%)`,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      <motion.div
        variants={shakeVariants as Variants}
        animate={shouldShake ? "shake" : ""}
        className="p-8 relative z-10"
      >
        <div className="max-w-2xl mx-auto">
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

        {/* Audio Player for Snippets */}
        <audio ref={audioRef} src={gameState.previewUrl as string} preload="auto" />
        
        {/* Audio Player for Full Song (Game Over) */}
        {isGameOver && gameState.previewUrl && (
          <audio
            ref={fullAudioRef}
            src={gameState.previewUrl}
            preload="auto"
            loop={false}
          />
        )}

        {/* Progress Bar: when game over, no "current" segment; completed = index < currentRound */}
        <div className="flex gap-2 mb-8">
          {ROUND_DURATIONS.map((duration, index) => {
            const result = gameState.guesses[index]?.result;
            const style = result != null ? getGuessResultStyle(result) : null;
            const isCompleted = index < gameState.currentRound;
            const isCurrent = !isGameOver && index === gameState.currentRound;
            return (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? style?.barClass ?? "bg-red-500"
                    : isCurrent
                    ? "bg-spotify-green"
                    : "bg-white/20"
                }`}
              />
            );
          })}
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
                <p className="text-gray-400">
                  by {gameState.answer.artist}
                  {gameState.answer.releaseYear && (
                    <span className="ml-2 text-white/40">• {gameState.answer.releaseYear}</span>
                  )}
                </p>
                
                {/* Audio Controls */}
                {gameState.previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-3 mt-4"
                  >
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleFullSong}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      aria-label={isFullSongPlaying ? "Pause" : "Play"}
                    >
                      {isFullSongPlaying ? (
                        <Pause className="w-5 h-5 text-white" fill="currentColor" />
                      ) : (
                        <Play className="w-5 h-5 text-white" fill="currentColor" />
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleMute}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Listen to Song, Album, and Playlist */}
            {gameState.answer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-white/10 space-y-3"
              >
                <p className="text-sm text-white/50 mb-3">Listen on Spotify:</p>
                
                {/* Listen to Song */}
                <a
                  href={`https://open.spotify.com/track/${gameState.answer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group"
                >
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                    {gameState.answer.albumImageUrl ? (
                      <Image
                        src={gameState.answer.albumImageUrl}
                        alt={gameState.answer.name}
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
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{gameState.answer.name}</p>
                      <span className="bg-spotify-green text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        SONG
                      </span>
                    </div>
                    <p className="text-xs text-white/60">by {gameState.answer.artist}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Listen to Album */}
                {gameState.answer.albumUrl && (
                  <a
                    href={gameState.answer.albumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group"
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                      {gameState.answer.albumImageUrl ? (
                        <Image
                          src={gameState.answer.albumImageUrl}
                          alt={gameState.answer.albumName || "Album"}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{gameState.answer.albumName || "Album"}</p>
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          ALBUM
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{gameState.answer.artist}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </motion.div>
            )}

            {/* Enhanced Playlist Info on Game Over */}
            {playlist && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                  // Stop full song playback
                  if (fullAudioRef.current) {
                    fullAudioRef.current.pause();
                    fullAudioRef.current.currentTime = 0;
                    setIsFullSongPlaying(false);
                    setIsMuted(false);
                  }
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
                            className="w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-white/5 last:border-b-0"
                          >
                            {track.albumImageUrl ? (
                              <Image
                                src={track.albumImageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-white/10 flex-shrink-0 flex items-center justify-center">
                                <Disc3 className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{track.name}</p>
                              <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                            </div>
                          </motion.button>
                        ))
                      ) : (
                        <div className="p-4 text-gray-400 text-center">
                          {isSearchLoading ? "Searching..." : searchQuery.trim().length < 2 ? "Type at least 2 characters" : "No songs found"}
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
                {gameState.guesses.map((guess, index) => {
                  const style = getGuessResultStyle(guess.result);
                  const isSkip = guess.result === GuessHistoryDtoResultEnum.Skip;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${style.cardClass}`}
                    >
                      {!isSkip && (
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style.badgeClass}`}
                          >
                            {style.label}
                          </span>
                        </div>
                      )}
                      <p className="font-medium">
                        {isSkip ? "Skipped" : guess.trackName}
                      </p>
                      {!isSkip && (
                        <p className="text-sm text-gray-400">{guess.artistName}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
