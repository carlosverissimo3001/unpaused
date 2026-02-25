'use client';

import { useParams } from 'next/navigation';
import { MultiplayerResultsPage } from '@/components/multiplayer/MultiplayerResultsPage';

export default function MultiplayerResultsRoute() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <MultiplayerResultsPage roomId={roomId} />;
}
