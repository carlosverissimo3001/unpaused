'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { UserPreferenceDto, UpdateUserPreferenceDto } from '@/sdk';

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.userPreferences.me;

  return useMutation<UserPreferenceDto, Error, UpdateUserPreferenceDto>({
    mutationFn: (updateUserPreferenceDto) =>
      api.userPreferencesControllerUpdate({ updateUserPreferenceDto }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UserPreferenceDto>(queryKey);
      queryClient.setQueryData<UserPreferenceDto>(queryKey, (old) => ({
        showAlbumHint: old?.showAlbumHint ?? true,
        showTextHints: old?.showTextHints ?? true,
        reducedMotion: old?.reducedMotion ?? false,
        showGuessHistory: old?.showGuessHistory ?? true,
        dailyChallengePlaylists: old?.dailyChallengePlaylists ?? [],
        timezone: old?.timezone ?? 'UTC',
        ...variables,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: UserPreferenceDto } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
