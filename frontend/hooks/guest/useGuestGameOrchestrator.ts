'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import { GuessHistoryDtoResultEnum as GuessResult } from '@/sdk/models/GuessHistoryDto';
import { useStartGuestGame } from './useStartGuestGame';
import { useGuestGameState } from './useGuestGameState';
import { useSubmitGuestGuess } from './useSubmitGuestGuess';
import { useSpotifyTrackSearch } from '@/hooks/spotify/useSpotifyTrackSearch';
import { useGameAudio } from '@/hooks/game/useGameAudio';

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
  /** True between asking for a new round and getting one, so the finished one
      cannot briefly reappear while the swap happens. */
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();
  const hasStarted = useRef(false);

  const startGameMutation = useStartGuestGame();
  // Subscribes to the cache rather than reading it once: setQueryData from the
  // mutation then re-renders this hook even when its observer was orphaned.
  const { data: cachedRoundId } = useQuery<string>({
    queryKey: queryKeys.guest.startedRound,
    // Never runs — v5 requires a queryFn even for a cache-only subscription.
    queryFn: () => Promise.reject(new Error('cache-only')),
    enabled: false,
    retry: false,
  });
  const roundId = startGameMutation.data?.sessionId ?? cachedRoundId;

  const {
    data: gameState,
    isLoading: loadingState,
    error: errorState,
  } = useGuestGameState(roundId);
  const submitGuessMutation = useSubmitGuestGuess();
  const spotifySearch = useSpotifyTrackSearch();

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startGameMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isGameOver =
    !isResetting && gameState?.status !== GameStateDtoStatusEnum.Playing;
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
    setIsResetting(true);
    setLastGuessResult(null);

    // The round id also lives under a predictable key so a Strict Mode
    // orphaned observer cannot strand it. That key has to be cleared too:
    // reset() only empties the mutation, so without this the finished round
    // is still what roundId resolves to, and the old song plays again for a
    // moment before the new one arrives.
    if (gameState?.sessionId) {
      queryClient.removeQueries({
        queryKey: queryKeys.guest.state(gameState.sessionId),
      });
    }
    // setQueryData rather than removeQueries: the orchestrator subscribes to
    // this key, and removing it would drop that subscription.
    queryClient.setQueryData(queryKeys.guest.startedRound, null);

    startGameMutation.reset();
    hasStarted.current = true;
    startGameMutation.mutate(undefined, {
      onSettled: () => setIsResetting(false),
    });
  }, [gameAudio, gameState, queryClient, startGameMutation]);

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
