'use client';

import { useParams } from 'next/navigation';
import { GamePage } from '@/components/game/GamePage';
import { GameStatsDtoModeEnum as GameMode } from '../../../sdk';

export default function PlaylistGamePage() {
  const params = useParams();
  const playlistId = params.playlistId as string;

  return <GamePage mode={GameMode.All} playlistId={playlistId} />;
}
