'use client';

import { useParams } from 'next/navigation';
import { MultiplayerGamePage } from '@/components/multiplayer/MultiplayerGamePage';

export default function MultiplayerPlayPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <MultiplayerGamePage roomId={roomId} />;
}
