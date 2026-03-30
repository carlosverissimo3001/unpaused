'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/sdk/client';
import { getApiErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/queryKeys';
import type { StartRunDtoDifficultyEnum } from '@/sdk';

export type GauntletPhase = 'IDLE' | 'PLAYING' | 'ENDED';

export interface RecentTrack {
  name: string;
  artistName: string;
  albumArt?: string;
  position: number;
}

interface GauntletRunState {
  phase: GauntletPhase;
  runId: string | null;
  score: number;
  difficulty: StartRunDtoDifficultyEnum | null;
  previewUrl: string | null;
  snippetDuration: number;
  isNewPersonalBest: boolean;
  isNewDailyBest: boolean;
  recentTracks: RecentTrack[];
  gameOverTrack: { name: string; artistName: string; albumArt?: string } | null;
  playlistId: string | null;
}

const INITIAL_STATE: GauntletRunState = {
  phase: 'IDLE',
  runId: null,
  score: 0,
  difficulty: null,
  previewUrl: null,
  snippetDuration: 1.5,
  isNewPersonalBest: false,
  isNewDailyBest: false,
  recentTracks: [],
  gameOverTrack: null,
  playlistId: null,
};

export function useGauntletRun() {
  const [state, setState] = useState<GauntletRunState>(INITIAL_STATE);
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: async ({
      playlistId,
      difficulty,
    }: {
      playlistId: string;
      difficulty: StartRunDtoDifficultyEnum;
    }) => {
      try {
        return await api.gauntletControllerStartRun({
          startRunDto: { playlistId, difficulty },
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (data, variables) => {
      setState({
        ...INITIAL_STATE,
        phase: 'PLAYING',
        runId: data.runId,
        score: data.score,
        difficulty: data.difficulty as StartRunDtoDifficultyEnum,
        previewUrl: data.previewUrl || null,
        snippetDuration: data.snippetDuration,
        playlistId: variables.playlistId,
      });
    },
  });

  const guessMutation = useMutation({
    mutationFn: async (params: {
      trackId?: string;
      skip?: boolean;
      trackName?: string;
      artistName?: string;
      albumName?: string;
    }) => {
      if (!state.runId || !state.playlistId) throw new Error('No active run');
      try {
        return await api.gauntletControllerSubmitGuess({
          id: state.runId,
          submitGauntletGuessDto: {
            playlistId: state.playlistId,
            trackId: params.trackId,
            skip: params.skip,
            trackName: params.trackName,
            artistName: params.artistName,
            albumName: params.albumName,
          },
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: (result) => {
      if (result.runOver) {
        setState((prev) => ({
          ...prev,
          phase: 'ENDED',
          score: result.score,
          isNewPersonalBest: result.isNewPersonalBest ?? false,
          isNewDailyBest: result.isNewDailyBest ?? false,
          gameOverTrack: result.actualTrack
            ? {
                name: result.actualTrack.name,
                artistName: result.actualTrack.artistName,
                albumArt: result.actualTrack.albumArt ?? undefined,
              }
            : null,
        }));
        // Invalidate personal best so the banner/setup refreshes
        void queryClient.invalidateQueries({
          queryKey: queryKeys.gauntlet.personalBest,
        });
      } else {
        setState((prev) => ({
          ...prev,
          score: result.score,
          previewUrl: result.nextPreviewUrl ?? prev.previewUrl,
          snippetDuration: result.nextSnippetDuration ?? prev.snippetDuration,
          recentTracks: [
            ...prev.recentTracks.slice(-5),
            {
              name: result.actualTrack?.name ?? '?',
              artistName: result.actualTrack?.artistName ?? '?',
              albumArt: result.actualTrack?.albumArt ?? undefined,
              position: result.score,
            },
          ],
        }));
      }
    },
  });

  const endMutation = useMutation({
    mutationFn: async () => {
      if (!state.runId) return;
      try {
        await api.gauntletControllerEndRun({ id: state.runId });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () => {
      setState((prev) => ({ ...prev, phase: 'ENDED' }));
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gauntlet.personalBest,
      });
    },
  });

  const startRun = useCallback(
    (playlistId: string, difficulty: StartRunDtoDifficultyEnum) =>
      startMutation.mutate({ playlistId, difficulty }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startMutation.mutate],
  );

  const submitGuess = useCallback(
    (params: {
      trackId?: string;
      skip?: boolean;
      trackName?: string;
      artistName?: string;
      albumName?: string;
    }) => guessMutation.mutate(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guessMutation.mutate],
  );

  const endRun = useCallback(
    () => endMutation.mutate(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endMutation.mutate],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    ...state,
    startRun,
    submitGuess,
    endRun,
    reset,
    isStarting: startMutation.isPending,
    isSubmitting: guessMutation.isPending,
    isEnding: endMutation.isPending,
    startError: startMutation.error?.message,
    guessError: guessMutation.error?.message,
  };
}
