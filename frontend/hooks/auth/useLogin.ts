'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { AuthMeResponseDto, LoginDto } from '@/sdk';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthMeResponseDto, Error, LoginDto>({
    mutationFn: async (loginDto) => {
      try {
        return await api.authControllerLoginWithPassword({ loginDto });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (data) => {
      // Everything on screen belonged to whoever was here before.
      queryClient.setQueryData(queryKeys.auth.me, data);
      void queryClient.invalidateQueries();
    },
  });
}
