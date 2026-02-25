'use client';

import { useParams } from 'next/navigation';
import { ResultsContainer } from '@/components/multiplayer/results';

export default function MultiplayerResultsRoute() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <ResultsContainer roomId={roomId} />;
}
