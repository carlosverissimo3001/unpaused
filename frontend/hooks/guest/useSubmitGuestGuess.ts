'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type {
  GuessResultDto,
  GuessDto,
  GameStateDto,
  GuessHistoryDto,
} from '@/sdk';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

interface SubmitGuestGuessParams {
  roundId: string;
  trackId?: string;
  skip?: boolean;
  trackName?: string;
  artistName?: string;
  albumName?: string;
}

/**
 * Guest equivalent of useSubmitGuess - same optimistic-update shape, against
 * the guest round endpoint and the guest query-key namespace.
 */
export function useSubmitGuestGuess() {
  const queryClient = useQueryClient();

  return useMutation<
    GuessResultDto,
    Error,
    SubmitGuestGuessParams,
    { previousState?: GameStateDto }
  >({
    mutationFn: async ({
      roundId,
      trackId,
      skip = false,
      trackName,
      artistName,
      albumName,
    }) => {
      const guessDto: GuessDto = {
        trackId: trackId || undefined,
        skip,
        trackName,
        artistName,
        albumName,
      };
      return api.guestGameControllerSubmitGuess({ id: roundId, guessDto });
    },
    onMutate: async ({ roundId, trackId, skip, trackName, artistName }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.guest.state(roundId),
      });

      const previousState = queryClient.getQueryData<GameStateDto>(
        queryKeys.guest.state(roundId),
      );

      if (previousState) {
        const optimisticGuess: GuessHistoryDto = {
          trackId: trackId ?? null,
          trackName: trackName ?? null,
          artistName: artistName ?? null,
          result: skip
            ? GuessHistoryDtoResultEnum.Skip
            : (null as unknown as GuessHistoryDtoResultEnum),
        };

        queryClient.setQueryData<GameStateDto>(queryKeys.guest.state(roundId), {
          ...previousState,
          guesses: [...previousState.guesses, optimisticGuess],
        });
      }

      return { previousState };
    },
    onSuccess: (result, variables) => {
      const currentState = queryClient.getQueryData<GameStateDto>(
        queryKeys.guest.state(variables.roundId),
      );

      if (currentState) {
        const updatedGuesses = [...currentState.guesses];
        if (updatedGuesses.length > 0) {
          updatedGuesses[updatedGuesses.length - 1] = {
            ...updatedGuesses[updatedGuesses.length - 1],
            result: result.result,
          };
        }

        const updatedState: GameStateDto = {
          ...currentState,
          currentRound: result.currentRound,
          snippetDuration: result.snippetDuration,
          status: result.status,
          guesses: updatedGuesses,
          hints: result.hints ?? currentState.hints,
        };

        queryClient.setQueryData<GameStateDto>(
          queryKeys.guest.state(variables.roundId),
          updatedState,
        );

        if (result.gameOver) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.guest.state(variables.roundId),
          });
        }
      }
    },
    onError: (_error, variables, context) => {
      if (context?.previousState != null) {
        queryClient.setQueryData<GameStateDto>(
          queryKeys.guest.state(variables.roundId),
          context.previousState,
        );
      }
      toast.error('Failed to submit guess. Please try again.');
    },
  });
}
