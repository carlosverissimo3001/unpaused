'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/sdk/client';

/**
 * Mutation hook to logout. Sends the user home once the session is gone.
 */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      return api.authControllerLogout();
    },
    onSuccess: () => {
      // A hard navigation rather than clearing the query cache. Pages such as
      // the speed run leaderboard render whether or not anyone is signed in,
      // so clearing alone left them mounted with their queries disabled, and
      // an absent result reads on screen as "no runs yet".
      window.location.href = '/';
    },
  });
}
