"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { api } from "@/sdk/client";
import type { GuessResultDto, GuessDto, GameStateDto, GuessHistoryDto } from "@/sdk";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";

interface SubmitGuessParams {
  sessionId: string;
  trackId: string | null;
  skip?: boolean;
}

/**
 * Mutation hook to submit a guess or skip a round
 * Implements optimistic updates for better UX
 */
export function useSubmitGuess() {
  const queryClient = useQueryClient();

  return useMutation<GuessResultDto, Error, SubmitGuessParams>({
    mutationFn: async ({ sessionId, trackId, skip = false }) => {
      const guessDto: GuessDto = { trackId: trackId || undefined, skip };
      return api.gameControllerSubmitGuess({ id: sessionId, guessDto });
    },
    onMutate: async ({ sessionId, trackId, skip }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.game.state(sessionId),
      });

      // Snapshot the previous value
      const previousState = queryClient.getQueryData<GameStateDto>(
        queryKeys.game.state(sessionId)
      );

      // Optimistically update the game state
      if (previousState) {
        const selectedTrack = trackId
          ? previousState.trackOptions.find((t) => t.id === trackId)
          : null;

        const optimisticGuess: GuessHistoryDto = {
          trackId: selectedTrack?.id || null,
          trackName: selectedTrack?.name || null,
          artistName: selectedTrack?.artist || null,
          result: skip ? GuessHistoryDtoResultEnum.Skip : GuessHistoryDtoResultEnum.Wrong, // We'll update this with the real result
        };

        const optimisticState: GameStateDto = {
          ...previousState,
          guesses: [...previousState.guesses, optimisticGuess],
        };

        queryClient.setQueryData<GameStateDto>(
          queryKeys.game.state(sessionId),
          optimisticState
        );
      }

      return { previousState };
    },
    onSuccess: (result, variables) => {
      // Update the game state with the actual result
      const currentState = queryClient.getQueryData<GameStateDto>(
        queryKeys.game.state(variables.sessionId)
      );

      if (currentState) {
        // Update the last guess with the real result
        const updatedGuesses = [...currentState.guesses];
        if (updatedGuesses.length > 0) {
          updatedGuesses[updatedGuesses.length - 1] = {
            ...updatedGuesses[updatedGuesses.length - 1],
            result: result.result,
          };
        }

        // Preserve trackOptions from the current state (backend doesn't return them)
        const updatedState: GameStateDto = {
          ...currentState,
          currentRound: result.currentRound,
          snippetDuration: result.snippetDuration,
          status: result.status,
          guesses: updatedGuesses,
          // Preserve trackOptions - backend getGameState returns empty array
          trackOptions: currentState.trackOptions || [],
        };

        queryClient.setQueryData<GameStateDto>(
          queryKeys.game.state(variables.sessionId),
          updatedState
        );

        // If game is over, refetch to get the answer
        if (result.gameOver) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.game.state(variables.sessionId),
          });
        }
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousState) {
        queryClient.setQueryData<GameStateDto>(
          queryKeys.game.state(variables.sessionId),
          context.previousState
        );
      }
    },
  });
}
