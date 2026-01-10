"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { startGame, submitGuess, getGameState, GameState, GuessHistory } from "@/lib/api";

const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const playlistId = params.playlistId as string;

  useEffect(() => {
    async function initGame() {
      try {
        const state = await startGame(playlistId);
        if (!state) {
          setError("Failed to start game");
        } else {
          setGameState(state);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start game");
      } finally {
        setLoading(false);
      }
    }

    if (playlistId) {
      initGame();
    }
  }, [playlistId]);

  const playSnippet = () => {
    if (!audioRef.current || !gameState) return;

    const duration = ROUND_DURATIONS[gameState.currentRound] * 1000;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }, duration);
  };

  const handleSubmit = async () => {
    if (!gameState || submitting || !selectedTrack) return;

    setSubmitting(true);
    try {
      const result = await submitGuess(gameState.sessionId, selectedTrack);
      if (!result) {
        setError("Failed to submit guess");
        setSubmitting(false);
        return;
      }

      // Update game state with the result
      const selectedOption = gameState.trackOptions.find(opt => opt.id === selectedTrack);
      const newGuess: GuessHistory = {
        trackId: selectedTrack,
        trackName: selectedOption?.name || null,
        artistName: selectedOption?.artist || null,
        result: result.result,
      };

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentRound: result.currentRound,
          snippetDuration: result.snippetDuration,
          status: result.status,
          guesses: [...prev.guesses, newGuess],
          answer: result.gameOver ? prev.answer : null, // Answer will be set when we fetch full state
        };
      });

      setSelectedTrack(null);

      // If game is over, fetch the full state to get the answer
      if (result.gameOver) {
        const updatedState = await getGameState(gameState.sessionId);
        if (updatedState) {
          setGameState(updatedState);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!gameState || submitting) return;

    setSubmitting(true);
    try {
      const result = await submitGuess(gameState.sessionId, null, true);
      if (!result) {
        setError("Failed to skip");
        setSubmitting(false);
        return;
      }

      // Update game state with the skip result
      const newGuess: GuessHistory = {
        trackId: null,
        trackName: null,
        artistName: null,
        result: "skip",
      };

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentRound: result.currentRound,
          snippetDuration: result.snippetDuration,
          status: result.status,
          guesses: [...prev.guesses, newGuess],
          answer: result.gameOver ? prev.answer : null,
        };
      });

      setSelectedTrack(null);

      // If game is over, fetch the full state to get the answer
      if (result.gameOver) {
        const updatedState = await getGameState(gameState.sessionId);
        if (updatedState) {
          setGameState(updatedState);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          <p className="text-red-400 mb-4">{error}</p>
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

  const isGameOver = gameState.status !== "playing";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Guess the Song</h1>
          <p className="text-gray-400">
            Round {gameState.currentRound + 1} of {ROUND_DURATIONS.length}
          </p>
        </div>

        {/* Audio Player */}
        <audio ref={audioRef} src={gameState.previewUrl} preload="auto" />

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {ROUND_DURATIONS.map((duration, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full ${
                index < gameState.currentRound
                  ? gameState.guesses[index]?.result === "correct"
                    ? "bg-green-500"
                    : gameState.guesses[index]?.result === "artist"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                  : index === gameState.currentRound
                  ? "bg-spotify-green"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Play Button */}
        {!isGameOver && (
          <div className="text-center mb-8">
            <button
              onClick={playSnippet}
              disabled={isPlaying}
              className="bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 text-black font-bold py-4 px-8 rounded-full text-lg transition-all"
            >
              {isPlaying
                ? `Playing ${ROUND_DURATIONS[gameState.currentRound]}s...`
                : `Play ${ROUND_DURATIONS[gameState.currentRound]}s Snippet`}
            </button>
          </div>
        )}

        {/* Game Over State */}
        {isGameOver && (
          <div className="text-center mb-8 p-8 bg-white/10 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">
              {gameState.status === "won" ? "You Won!" : "Game Over"}
            </h2>
            {gameState.answer && (
              <div className="mb-6">
                <p className="text-gray-400 mb-2">The song was:</p>
                <p className="text-xl font-semibold">
                  {gameState.answer.name}
                </p>
                <p className="text-gray-400">
                  by {gameState.answer.artist}
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push(`/game/${playlistId}`)}
                className="bg-spotify-green hover:bg-green-400 text-black font-bold py-3 px-6 rounded-full transition-all"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-full transition-all"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {/* Track Options */}
        {!isGameOver && (
          <div className="space-y-3 mb-8">
            {gameState.trackOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedTrack(option.id)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selectedTrack === option.id
                    ? "bg-spotify-green text-black"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <p className="font-medium">{option.name}</p>
                <p
                  className={`text-sm ${
                    selectedTrack === option.id
                      ? "text-black/70"
                      : "text-gray-400"
                  }`}
                >
                  {option.artist}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {!isGameOver && (
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              disabled={submitting}
              className="flex-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-bold py-3 px-6 rounded-full transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTrack || submitting}
              className="flex-1 bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-full transition-all"
            >
              Submit
            </button>
          </div>
        )}

        {/* Guess History */}
        {gameState.guesses?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Previous Guesses</h3>
            <div className="space-y-2">
              {gameState.guesses.map((guess, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    guess.result === "correct"
                      ? "bg-green-500/20 border border-green-500/50"
                      : guess.result === "artist"
                      ? "bg-yellow-500/20 border border-yellow-500/50"
                      : guess.result === "skip"
                      ? "bg-gray-500/20 border border-gray-500/50"
                      : "bg-red-500/20 border border-red-500/50"
                  }`}
                >
                  <p className="font-medium">
                    {guess.result === "skip" ? "Skipped" : guess.trackName}
                  </p>
                  {guess.result !== "skip" && (
                    <p className="text-sm text-gray-400">{guess.artistName}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
