"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import { ApiApi } from "@/sdk";
import type {
  GameStateDto,
  GuessResultDto,
  GuessHistoryDto,
  StartGameDto,
  GuessDto,
} from "@/sdk";

const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];

// Game state type
type GameSessionState = {
  gameState: GameStateDto | null;
  loading: boolean;
  error: string | null;
  isPlaying: boolean;
  submitting: boolean;
};

// Action types
type GameSessionAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; payload: GameStateDto }
  | { type: "INIT_ERROR"; payload: string }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "GUESS_SUBMITTED"; payload: { result: GuessResultDto; guess: GuessHistoryDto } }
  | { type: "GAME_STATE_UPDATED"; payload: GameStateDto };

// Initial state
const initialState: GameSessionState = {
  gameState: null,
  loading: true,
  error: null,
  isPlaying: false,
  submitting: false,
};

// Reducer
function gameSessionReducer(
  state: GameSessionState,
  action: GameSessionAction
): GameSessionState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, loading: true, error: null };
    case "INIT_SUCCESS":
      return {
        ...state,
        gameState: action.payload,
        loading: false,
        error: null,
      };
    case "INIT_ERROR":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "GUESS_SUBMITTED":
      return {
        ...state,
        gameState: state.gameState
          ? {
              ...state.gameState,
              currentRound: action.payload.result.currentRound,
              snippetDuration: action.payload.result.snippetDuration,
              status: action.payload.result.status,
              guesses: [...state.gameState.guesses, action.payload.guess],
            }
          : null,
        submitting: false,
      };
    case "GAME_STATE_UPDATED":
      return {
        ...state,
        gameState: action.payload,
      };
    default:
      return state;
  }
}

// Hook interface
export interface UseGameSessionReturn {
  // State
  gameState: GameStateDto | null;
  loading: boolean;
  error: string | null;
  isPlaying: boolean;
  submitting: boolean;
  isGameOver: boolean;

  // Actions
  startGame: (playlistId: string) => Promise<void>;
  submitGuess: (params: { trackId: string; trackName?: string; artistName?: string }) => Promise<void>;
  skipRound: () => Promise<void>;
  playSnippet: (audioRef: React.RefObject<HTMLAudioElement>) => void;
}

/**
 * Custom hook for managing game session state and logic
 * Encapsulates all game state management, API calls, and timer logic
 */
export function useGameSession(): UseGameSessionReturn {
  const [state, dispatch] = useReducer(gameSessionReducer, initialState);
  const apiRef = useRef<ApiApi | null>(null);

  // Initialize API client
  useEffect(() => {
    if (!apiRef.current) {
      const { Configuration } = require("@/sdk");
      const config = new Configuration({
        basePath: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        credentials: "include",
      });
      apiRef.current = new ApiApi(config);
    }
  }, []);

  // Check if game is over
  const isGameOver =
    state.gameState?.status !== "PLAYING";

  /**
   * Start a new game session
   */
  const startGame = useCallback(
    async (playlistId: string) => {
      if (!apiRef.current) return;

      dispatch({ type: "INIT_START" });
      try {
        const startGameDto: StartGameDto = { playlistId };
        const gameState = await apiRef.current.gameControllerStartGame({
          startGameDto,
        });
        dispatch({ type: "INIT_SUCCESS", payload: gameState });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start game";
        dispatch({ type: "INIT_ERROR", payload: errorMessage });
      }
    },
    []
  );

  /**
   * Submit a guess for the current round (trackName/artistName from search selection).
   */
  const submitGuess = useCallback(
    async (params: { trackId: string; trackName?: string; artistName?: string; albumName?: string }) => {
      const { trackId, trackName, artistName, albumName } = params;
      if (!apiRef.current || !state.gameState || state.submitting) return;

      dispatch({ type: "SET_SUBMITTING", payload: true });
      try {
        const guessDto: GuessDto = { trackId, skip: false, trackName, artistName, albumName };
        const result = await apiRef.current.gameControllerSubmitGuess({
          id: state.gameState.sessionId,
          guessDto,
        });

        const guess: GuessHistoryDto = {
          trackId: trackId ?? null,
          trackName: trackName ?? null,
          artistName: artistName ?? null,
          result: result.result,
        };

        dispatch({
          type: "GUESS_SUBMITTED",
          payload: { result, guess },
        });

        // If game is over, fetch full state to get the answer
        if (result.gameOver && apiRef.current) {
          const updatedState = await apiRef.current.gameControllerGetGameState(
            {
              id: state.gameState.sessionId,
            }
          );
          dispatch({ type: "GAME_STATE_UPDATED", payload: updatedState });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to submit guess";
        dispatch({ type: "INIT_ERROR", payload: errorMessage });
        dispatch({ type: "SET_SUBMITTING", payload: false });
      }
    },
    [state.gameState, state.submitting]
  );

  /**
   * Skip the current round
   */
  const skipRound = useCallback(async () => {
    if (!apiRef.current || !state.gameState || state.submitting) return;

    dispatch({ type: "SET_SUBMITTING", payload: true });
    try {
      const guessDto: GuessDto = { skip: true };
      const result = await apiRef.current.gameControllerSubmitGuess({
        id: state.gameState.sessionId,
        guessDto,
      });

      const guess: GuessHistoryDto = {
        trackId: null,
        trackName: null,
        artistName: null,
        result: result.result,
      };

      dispatch({
        type: "GUESS_SUBMITTED",
        payload: { result, guess },
      });

      // If game is over, fetch full state to get the answer
      if (result.gameOver && apiRef.current) {
        const updatedState = await apiRef.current.gameControllerGetGameState({
          id: state.gameState.sessionId,
        });
        dispatch({ type: "GAME_STATE_UPDATED", payload: updatedState });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to skip";
      dispatch({ type: "INIT_ERROR", payload: errorMessage });
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [state.gameState, state.submitting]);

  /**
   * Play audio snippet for the current round
   */
  const playSnippet = useCallback(
    (audioRef: React.RefObject<HTMLAudioElement>) => {
      if (!audioRef.current || !state.gameState) return;

      const duration =
        ROUND_DURATIONS[state.gameState.currentRound] * 1000;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      dispatch({ type: "SET_PLAYING", payload: true });

      const timeoutId = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        dispatch({ type: "SET_PLAYING", payload: false });
      }, duration);

      // Cleanup on unmount or when game state changes
      return () => {
        clearTimeout(timeoutId);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    },
    [state.gameState]
  );

  return {
    gameState: state.gameState,
    loading: state.loading,
    error: state.error,
    isPlaying: state.isPlaying,
    submitting: state.submitting,
    isGameOver,
    startGame,
    submitGuess,
    skipRound,
    playSnippet,
  };
}
