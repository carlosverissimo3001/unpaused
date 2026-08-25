'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { rememberSignedIn } from '@/lib/returning-player';
import { api } from '@/sdk/client';
import type { AuthMeResponseDto, SignupDto } from '@/sdk';

/** Claims the row the player already has, so their rounds come with them. */
export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation<AuthMeResponseDto, Error, SignupDto>({
    mutationFn: async (signupDto) => {
      try {
        return await api.authControllerSignup({ signupDto });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (data) => {
      rememberSignedIn(data.email);
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });
}
