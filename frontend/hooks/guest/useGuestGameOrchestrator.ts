'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import { GuessHistoryDtoResultEnum as GuessResult } from '@/sdk/models/GuessHistoryDto';
import { useStartGuestGame } from './useStartGuestGame';
import { useGuestGameState } from './useGuestGameState';
import { useSubmitGuestGuess } from './useSubmitGuestGuess';
import { useGuestTrackSearch } from './useGuestTrackSearch';
import { useGameAudio } from '@/hooks/game/useGameAudio';
import { triggerConfetti } from '@/components/game/confetti';

const ShouldShakeResult: GuessResult[] = [
  GuessResult.Wrong,
  GuessResult.Artist,
  GuessResult.Album,
  GuessResult.ArtistAndAlbum,
];

/**
 * Guest equivalent of useGameOrchestrator: no playlist, no daily/stats/streak
 * concepts, no persisted history - starts a round against the curated pool
 * and plays it out. The audio/search/scoring sub-systems are the exact same
 * hooks (or same-shaped guest variants) the authenticated game uses.
 */
export function useGuestGameOrchestrator({
  volume = 0.8,
}: { volume?: number } = {}) {
  const [lastGuessResult, setLastGuessResult] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const startGameMutation = useStartGuestGame();
  const roundId = startGameMutation.data?.sessionId;

  const {
    data: gameState,
    isLoading: loadingState,
    error: errorState,
  } = useGuestGameState(roundId);
  const submitGuessMutation = useSubmitGuestGuess();
  const spotifySearch = useGuestTrackSearch();

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startGameMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isGameOver = gameState?.status !== GameStateDtoStatusEnum.Playing;
  const gameAudio = useGameAudio({
    previewUrl: gameState?.previewUrl,
    isGameOver: !!isGameOver,
    snippetDuration: gameState?.snippetDuration ?? 0.5,
    volume,
  });

  const isLoading = !roundId ? !startGameMutation.error : loadingState;
  const error = startGameMutation.error ?? errorState;
  const submitPending = submitGuessMutation.isPending;

  useEffect(() => {
    if (!gameState?.guesses?.length) return;
    const last = gameState.guesses[gameState.guesses.length - 1];
    if (last.result !== lastGuessResult) {
      setLastGuessResult(last.result);
      if (last.result === GuessResult.Correct) triggerConfetti();
    }
  }, [gameState?.guesses, lastGuessResult]);

  const handleSubmit = useCallback(() => {
    if (!gameState || submitPending || !roundId) return;
    if (!spotifySearch.selectedTrack) return;
    submitGuessMutation.mutate(
      {
        roundId,
        trackId: spotifySearch.selectedTrack.id,
        skip: false,
        trackName: spotifySearch.selectedTrack.name,
        artistName: spotifySearch.selectedTrack.artist,
        albumName: spotifySearch.selectedTrack.albumName,
      },
      { onSuccess: () => spotifySearch.handleClearSelection() },
    );
  }, [gameState, submitPending, roundId, spotifySearch, submitGuessMutation]);

  const handleSkip = useCallback(() => {
    if (!gameState || submitPending || !roundId) return;
    submitGuessMutation.mutate({ roundId, skip: true });
  }, [gameState, submitPending, roundId, submitGuessMutation]);

  const handlePlayAgain = useCallback(() => {
    gameAudio.stopFullSong();
    hasStarted.current = false;
    startGameMutation.reset();
    setLastGuessResult(null);
    hasStarted.current = true;
    startGameMutation.mutate();
  }, [gameAudio, startGameMutation]);

  const lastGuess = gameState?.guesses?.[gameState.guesses.length - 1];
  const shouldShake = lastGuess
    ? ShouldShakeResult.includes(lastGuess.result)
    : false;

  return {
    gameState,
    isLoading,
    error,
    isGameOver,
    submitPending,
    shouldShake,
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
    handlePlayAgain,
  };
}
