"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GameStateDtoStatusEnum } from "@/sdk/models/GameStateDto";
import { GuessHistoryDtoResultEnum as GuessResult } from "@/sdk/models/GuessHistoryDto";
import { queryKeys } from "@/lib/queryKeys";
import { useGameSession } from "./useGameSession";
import { useGameState } from "./useGameState";
import { useSubmitGuess } from "./useSubmitGuess";
import { useGameAudio } from "./useGameAudio";
import { useGameStats } from "./useGameStats";
import { useSpotifyTrackSearch } from "@/hooks/spotify/useSpotifyTrackSearch";
import { usePlaylistById } from "@/hooks/playlists/usePlaylistById";
import { triggerConfetti } from "@/components/game/confetti";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";

const ShouldShakeResult: GuessResult[] = [
  GuessResult.Wrong,
  GuessResult.Artist,
  GuessResult.Album,
  GuessResult.ArtistAndAlbum,
];

export function useGameOrchestrator(mode: GameMode, playlistId?: string) {
  const queryClient = useQueryClient();
  
  const processedResultIdRef = useRef<string | null>(null);

  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;

  const { data: playlist } = usePlaylistById(playlistId ?? "");
  const {
    sessionId,
    isLoading: sessionLoading,
    error: sessionError,
    startGameMutation,
  } = useGameSession(mode, playlistId);
  
  const { 
    data: gameState, 
    isLoading: loadingState, 
    error: errorState, 
    isFetching: isFetchingGameState 
  } = useGameState(sessionId);
  
  const submitGuessMutation = useSubmitGuess();
  const spotifySearch = useSpotifyTrackSearch();
  const { data: stats } = useGameStats({ mode, useCached: false });

  const isGameOver = gameState?.status !== GameStateDtoStatusEnum.Playing;
  const gameAudio = useGameAudio({
    previewUrl: gameState?.previewUrl,
    isGameOver: !!isGameOver,
    currentRound: gameState?.currentRound ?? 0,
  });

  const isLoading = isPlaylist || isDaily ? sessionLoading || loadingState : false;
  const error = sessionError ?? errorState;
  
  const isGuessLoading = submitGuessMutation.isPending || (submitGuessMutation.isSuccess && isFetchingGameState);

  const currentGuesses = gameState?.guesses ?? [];
  const lastGuess = currentGuesses[currentGuesses.length - 1];
  const currentResult = lastGuess?.result ?? null;
  
  const currentGuessKey = lastGuess ? `${gameState?.currentRound}-${currentResult}` : null;

  useEffect(() => {
    if (isGuessLoading || !currentResult || currentGuessKey === processedResultIdRef.current) {
      return;
    }

    processedResultIdRef.current = currentGuessKey;

    if (currentResult === GuessResult.Correct) {
      triggerConfetti();
    }
  }, [currentResult, currentGuessKey, isGuessLoading]);

  useEffect(() => {
    if (isGameOver) {
      queryClient.invalidateQueries({ queryKey: queryKeys.game.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.game.playedToday });
      queryClient.invalidateQueries({ queryKey: ["game", "history"] });
      queryClient.invalidateQueries({ queryKey: ["daily", "history"] });
    }
  }, [isDaily, isGameOver, queryClient]);

  const handleSubmit = useCallback(() => {
    if (!gameState || isGuessLoading) return;
    if (!spotifySearch.selectedTrack) return;

    submitGuessMutation.mutate(
      {
        sessionId: gameState.sessionId,
        trackId: spotifySearch.selectedTrack.id,
        skip: false,
        trackName: spotifySearch.selectedTrack.name,
        artistName: spotifySearch.selectedTrack.artist,
        albumName: spotifySearch.selectedTrack.albumName,
      },
      { onSuccess: () => spotifySearch.handleClearSelection() },
    );
  }, [gameState, isGuessLoading, spotifySearch, submitGuessMutation]);

  const handleSkip = useCallback(() => {
    if (!gameState || isGuessLoading) return;
    submitGuessMutation.mutate({
      sessionId: gameState.sessionId,
      skip: true,
    });
  }, [gameState, isGuessLoading, submitGuessMutation]);

  const handlePlayAgain = useCallback(() => {
    gameAudio.stopFullSong();
    if (gameState?.sessionId) {
      queryClient.removeQueries({ queryKey: queryKeys.game.state(gameState.sessionId) });
    }
    processedResultIdRef.current = null;
    startGameMutation.reset();
    if (playlistId) {
      startGameMutation.mutate({ playlistId, mode: GameMode.All });
    }
  }, [gameAudio, gameState, queryClient, startGameMutation, playlistId]);

  const shouldShake = lastGuess && !isGuessLoading
    ? ShouldShakeResult.includes(lastGuess.result) 
    : false;

  return {
    playlist,
    gameState,
    stats,
    isLoading,
    error,
    isGameOver,
    isPlaylist,
    isDaily,
    submitPending: isGuessLoading,
    shouldShake,
    isGuessLoading,
    gameAudio,
    spotifySearch,
    handleSubmit,
    handleSkip,
    handlePlayAgain,
  };
}