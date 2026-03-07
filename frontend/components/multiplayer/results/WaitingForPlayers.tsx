import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import type { RoomPlayerDto } from '@/sdk';
import { HostDisconnectedBanner } from '../HostDisconnectedBanner';

interface WaitingForPlayersProps {
  players: RoomPlayerDto[];
  totalRounds: number;
  playerProgress: Map<string, number>;
  hostDisconnected: boolean;
}

export function WaitingForPlayers({
  players,
  totalRounds,
  playerProgress,
  hostDisconnected,
}: WaitingForPlayersProps) {
  return (
    <div
      className="flex min-h-screen min-h-[100dvh] items-center justify-center"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        animate={{
          opacity: [0.6, 1, 0.6],
          background: [
            `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.06) 0%, transparent 50%)`,
            `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.1) 0%, transparent 50%)`,
            `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.06) 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mb-4 inline-block"
          >
            <Loader2 className="h-8 w-8 text-[#1DB954]" />
          </motion.div>
          <h2 className="mb-2 text-xl font-bold text-fg">
            Waiting for other players
          </h2>
          <p className="text-sm text-fg/40">
            Results will appear once everyone finishes
          </p>
        </motion.div>

        {/* Host disconnected warning */}
        <AnimatePresence>
          {hostDisconnected && <HostDisconnectedBanner />}
        </AnimatePresence>

        {/* Player progress card */}
        {players.length > 0 && totalRounds > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-fg/10 bg-fg/[0.03] overflow-hidden divide-y divide-fg/5"
          >
            {players.map((player, index) => {
              const lastRoundIndex = playerProgress.get(player.userId);
              const completedRounds =
                lastRoundIndex !== undefined ? lastRoundIndex + 1 : 0;
              const isDone = completedRounds >= totalRounds;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.06 }}
                  className="px-4 py-3.5 flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={player.displayName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border-2 border-fg/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-fg/10 border-2 border-fg/10 flex items-center justify-center text-sm font-bold text-fg/60">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Status indicator on avatar */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-bg flex items-center justify-center ${
                        isDone ? 'bg-green-500' : 'bg-fg/20'
                      }`}
                    >
                      {isDone ? (
                        <Check
                          className="w-2.5 h-2.5 text-fg"
                          strokeWidth={3}
                        />
                      ) : (
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-[#1DB954]"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Name + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-fg truncate">
                        {player.displayName}
                      </span>
                      <span
                        className={`text-xs font-mono shrink-0 ml-2 ${
                          isDone ? 'text-green-400 font-semibold' : 'text-fg/30'
                        }`}
                      >
                        {isDone ? 'Done' : `${completedRounds}/${totalRounds}`}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: totalRounds }, (_, i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 flex-1 rounded-full bg-fg/10 overflow-hidden"
                        >
                          <motion.div
                            className={`h-full rounded-full ${
                              isDone ? 'bg-green-500' : 'bg-[#1DB954]'
                            }`}
                            initial={{ width: 0 }}
                            animate={{
                              width: i < completedRounds ? '100%' : '0%',
                            }}
                            transition={{
                              duration: 0.4,
                              delay: i * 0.08,
                              ease: 'easeOut',
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
