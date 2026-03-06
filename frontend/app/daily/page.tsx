'use client';

import { useState, useCallback } from 'react';
import { GamePage } from '@/components/game/GamePage';
import { StreakFreezePrompt } from '@/components/streak/StreakFreezePrompt';
import { useStreakStatus } from '@/hooks/streak/useStreakStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

export default function DailyPage() {
  const { data: status, isLoading } = useStreakStatus();
  const [promptResolved, setPromptResolved] = useState(false);
  const resolvePrompt = useCallback(() => setPromptResolved(true), []);

  // While loading streak status, show a brief spinner
  if (isLoading) {
    return (
      <div
        className="h-screen h-[100dvh] flex items-center justify-center"
        style={{ background: '#121212' }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show freeze prompt before the game if streak is at risk
  if (status?.streakAtRisk && !promptResolved) {
    return <StreakFreezePrompt onResolved={resolvePrompt} />;
  }

  return <GamePage mode={GameMode.Daily} />;
}
