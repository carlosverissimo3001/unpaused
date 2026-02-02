"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { GuessResultDto, GuessHistoryDto, DailyTodayDto } from "@/sdk";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";
import { api } from "@/sdk/client";

interface DailyGuessParams {
  trackId?: string | null;
  skip?: boolean;
  trackName?: string;
  artistName?: string;
  albumName?: string;
}

export function useDailyGuess() {
  const queryClient = useQueryClient();

  return useMutation<
    GuessResultDto,
    Error,
    DailyGuessParams,
    { previousState?: DailyTodayDto | null }
  >({
    mutationFn: async (params) => {
      const result = await api.dailyControllerSubmitGuess({
        guessDto: {
          trackId: params.trackId,
          skip: params.skip,
          trackName: params.trackName,
          artistName: params.artistName,
          albumName: params.albumName,
        },
      });
      if (!result) throw new Error("Failed to submit guess");
      return result;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.daily.today });
      const previousState = queryClient.getQueryData<DailyTodayDto | null>(
        queryKeys.daily.today
      );
      if (previousState) {
        const optimisticGuess: GuessHistoryDto = {
          trackId: variables.trackId ?? undefined,
          trackName: variables.trackName ?? undefined,
          artistName: variables.artistName ?? undefined,
          result: variables.skip
            ? GuessHistoryDtoResultEnum.Skip
            : GuessHistoryDtoResultEnum.Wrong,
        };
        queryClient.setQueryData<DailyTodayDto>(queryKeys.daily.today, {
          ...previousState,
          guesses: [...previousState.guesses, optimisticGuess],
        });
      }
      return { previousState };
    },
    onSuccess: (result, variables) => {
      const current = queryClient.getQueryData<DailyTodayDto | null>(
        queryKeys.daily.today
      );
      if (current) {
        const updatedGuesses = [...current.guesses];
        if (updatedGuesses.length > 0) {
          updatedGuesses[updatedGuesses.length - 1] = {
            ...updatedGuesses[updatedGuesses.length - 1],
            result: result.result,
          };
        }
        const updated: DailyTodayDto = {
          ...current,
          currentRound: result.currentRound,
          snippetDuration: result.snippetDuration,
          status: result.status,
          guesses: updatedGuesses,
        };
        queryClient.setQueryData(queryKeys.daily.today, updated);
        if (result.gameOver) {
          queryClient.invalidateQueries({ queryKey: queryKeys.daily.today });
          queryClient.invalidateQueries({ queryKey: queryKeys.daily.stats });
        }
      }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousState != null) {
        queryClient.setQueryData(queryKeys.daily.today, context.previousState);
      }
    },
  });
}
