'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { queryKeys } from '@/lib/queryKeys';
import type { RoomDto } from '@/sdk';

interface UseMultiplayerSocketOptions {
  onPlayerRoundComplete?: (data: {
    userId: string;
    displayName: string;
    roundIndex: number;
  }) => void;
}

export function useMultiplayerSocket(
  roomId: string | undefined,
  options?: UseMultiplayerSocketOptions,
) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [hostDisconnected, setHostDisconnected] = useState(false);

  const onPlayerRoundCompleteRef = useRef(options?.onPlayerRoundComplete);
  useEffect(() => {
    onPlayerRoundCompleteRef.current = options?.onPlayerRoundComplete;
  });

  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  });

  useEffect(() => {
    if (!roomId) return;

    // Derive WS URL from the current page origin so the cookie domain matches
    // (e.g. 127.0.0.1 vs localhost). Fall back to env var for production.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const wsUrl =
      typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:${new URL(apiUrl).port}`
        : apiUrl;

    const socket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('authenticated', () => {
      setConnected(true);
      socket.emit('joinRoom', { roomId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('roomUpdated', (data: RoomDto) => {
      const currentRoomId = roomIdRef.current!;
      queryClient.setQueryData(queryKeys.multiplayer.room(currentRoomId), data);
      if (data.status === 'COMPLETED') {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.multiplayer.scoreboard(currentRoomId),
        });
      }
    });

    socket.on(
      'playerRoundComplete',
      (data: { userId: string; displayName: string; roundIndex: number }) => {
        onPlayerRoundCompleteRef.current?.(data);

        // Invalidate scoreboard so live scores update after every round
        void queryClient.invalidateQueries({
          queryKey: queryKeys.multiplayer.scoreboard(roomIdRef.current!),
        });
      },
    );

    socket.on(
      'presenceUpdate',
      (data: { roomId: string; onlineUserIds: string[] }) => {
        setOnlineUserIds(data.onlineUserIds);
      },
    );

    socket.on('hostDisconnected', () => setHostDisconnected(true));
    socket.on('hostReconnected', () => setHostDisconnected(false));

    return () => {
      socket.disconnect();
      setConnected(false);
      setOnlineUserIds([]);
      setHostDisconnected(false);
    };
  }, [roomId, queryClient]);

  return { connected, onlineUserIds, hostDisconnected };
}
