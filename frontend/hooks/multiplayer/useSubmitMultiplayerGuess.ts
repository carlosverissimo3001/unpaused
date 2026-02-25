'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { GuessResultDto } from '@/sdk';
import type { GuessDto } from '@/sdk';

export function useSubmitMultiplayerGuess() {
    const queryClient = useQueryClient();

    return useMutation<GuessResultDto, Error, { roomId: string; guess: GuessDto }>({
        mutationFn: async ({ roomId, guess }) => {
            try {
                return await api.multiplayerControllerSubmitGuess({ id: roomId, guessDto: guess });
            } catch (e) {
                const message = await getApiErrorMessage(e);
                throw new Error(message);
            }
        },
        onSuccess: (_, { roomId }) => {
            // Invalidate the round state to refetch updated state
            void queryClient.invalidateQueries({
                queryKey: queryKeys.multiplayer.round(roomId),
            });
            // Also invalidate scoreboard since round might be complete
            void queryClient.invalidateQueries({
                queryKey: queryKeys.multiplayer.scoreboard(roomId),
            });
        },
    });
}
