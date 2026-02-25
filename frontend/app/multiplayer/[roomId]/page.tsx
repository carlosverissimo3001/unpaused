'use client';

import PlayerRow from '@/components/multiplayer/PlayerRow';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMe } from '@/hooks/auth/useMe';
import { useLeaveRoom } from '@/hooks/multiplayer/useLeaveRoom';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { useStartRoom } from '@/hooks/multiplayer/useStartRoom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  LogOut,
  Music,
  Play,
  Users,
  Wifi,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function RoomLobbyPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const { data: user } = useMe();
  const { data: room, isLoading, isError, error } = useRoom(roomId);
  const startRoom = useStartRoom();
  const leaveRoom = useLeaveRoom();
  const [copied, setCopied] = useState(false);

  // Find current user's player entry to determine host status
  const currentPlayer = useMemo(() => {
    if (!room || !user) return null;
    return (
      room.players.find((p) => p.spotifyUserId === user.spotifyUserId) ?? null
    );
  }, [room, user]);

  const isHost = currentPlayer ? currentPlayer.userId === room?.hostId : false;
  const canStart = isHost && (room?.players.length ?? 0) >= 2;

  const inviteUrl =
    typeof window !== 'undefined' && room
      ? `${window.location.origin}/multiplayer/join/${room.inviteCode}`
      : '';

  // Redirect to game when status changes to PLAYING
  useEffect(() => {
    if (room?.status === 'PLAYING') {
      router.replace(`/multiplayer/${roomId}/play`);
    }
  }, [room?.status, roomId, router]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  function handleStartGame() {
    if (!roomId || startRoom.isPending) return;
    startRoom.mutate(roomId);
  }

  function handleLeaveRoom() {
    if (!roomId || leaveRoom.isPending) return;
    leaveRoom.mutate(roomId, {
      onSuccess: () => router.replace('/'),
    });
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-spotify-black text-white">
        <LoadingSpinner size="md" />
        <p className="text-white/50 text-sm">Loading room...</p>
      </main>
    );
  }

  // Error / expired / completed
  if (isError || !room || room.status === 'EXPIRED') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl text-center"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {room?.status === 'EXPIRED' ? 'Room Expired' : 'Room Not Found'}
          </h2>
          <p className="text-white/50 text-sm mb-6">
            {isError
              ? (error?.message ?? 'Could not load room.')
              : 'This room is no longer available.'}
          </p>
          <button
            onClick={() => router.replace('/')}
            className="flex items-center gap-2 mx-auto text-spotify-green hover:underline text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </motion.div>
      </main>
    );
  }

  // Completed state
  if (room.status === 'COMPLETED') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl text-center"
        >
          <div className="w-12 h-12 rounded-full bg-spotify-green/10 border border-spotify-green/20 flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-spotify-green" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Game Complete</h2>
          <p className="text-white/50 text-sm mb-6">
            This room has finished playing.
          </p>
          <button
            onClick={() => router.replace('/')}
            className="flex items-center gap-2 mx-auto text-spotify-green hover:underline text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-spotify-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[150px] left-1/4 w-[400px] h-[400px] bg-spotify-green/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Header bar */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-spotify-black/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleLeaveRoom}
            disabled={leaveRoom.isPending}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            {leaveRoom.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Leave
          </button>

          <div className="flex items-center gap-2 text-xs text-white/40">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-3.5 h-3.5 text-spotify-green" />
            </motion.div>
            Waiting for players
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          {/* Invite code card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-center"
          >
            {/* Card glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-spotify-green/10 rounded-full blur-[60px] pointer-events-none" />

            <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold mb-3">
              Invite Code
            </p>
            <p className="text-4xl sm:text-5xl font-mono font-black text-spotify-green tracking-[0.3em] mb-6 select-all">
              {room.inviteCode}
            </p>

            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-spotify-green" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </motion.button>
            </div>

            {/* Room info pills */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
                <Music className="w-3 h-3" />
                {room.roundCount} rounds
              </span>
            </div>
          </motion.div>

          {/* Players list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Players
              </h3>
              <span className="text-xs font-mono text-white/30">
                {room.players.length}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {room.players.map((player, index) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isHost={player.userId === room.hostId}
                    isCurrentUser={player.spotifyUserId === user?.spotifyUserId}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            {isHost && (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || startRoom.isPending}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-spotify-green px-6 py-4 text-base font-bold text-black hover:bg-spotify-green/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-[0_0_30px_rgba(30,215,96,0.15)]"
                >
                  {startRoom.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-5 h-5" fill="currentColor" />
                      Start Game
                    </>
                  )}
                </button>
                {!canStart && (
                  <p className="text-xs text-white/30 text-center">
                    Need at least 2 players to start
                  </p>
                )}
                {startRoom.isError && (
                  <p className="text-sm text-red-400 text-center">
                    {startRoom.error.message}
                  </p>
                )}
              </>
            )}

            {!isHost && (
              <div className="text-center py-2">
                <motion.p
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-sm text-white/40"
                >
                  Waiting for host to start the game...
                </motion.p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
