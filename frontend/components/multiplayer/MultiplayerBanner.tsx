'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, ArrowRight, Gamepad2 } from 'lucide-react';
import { JoinRoomModal } from './JoinRoomModal';
import { CreateRoomModal } from './CreateRoomModal';

function MultiplayerBannerComponent() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-6 shadow-2xl group transform-gpu"
      >
        {/* Animated background glow */}
        <motion.div
          animate={{
            rotate: [0, -360],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[120px] -left-[80px] w-[280px] h-[280px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none"
        />
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-[100px] -right-[60px] w-[220px] h-[220px] bg-spotify-green/10 rounded-full blur-[70px] pointer-events-none"
        />

        <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left side: info */}
          <div className="flex flex-col gap-1 sm:gap-3 flex-1 min-w-0">
            <div className="hidden sm:inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/10 w-fit text-[10px] uppercase tracking-wider font-bold text-white/70">
              <Gamepad2 className="w-3 h-3" />
              Multiplayer
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <h2 className="text-lg sm:text-3xl font-black tracking-tighter text-white truncate leading-tight">
                Play with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-spotify-green">
                  Friends.
                </span>
              </h2>
              <p className="text-white/50 text-[10px] sm:text-base font-medium leading-snug">
                Compete head-to-head. Who knows the vibes?
              </p>
            </div>
          </div>

          {/* Right side: actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-5 rounded-full text-[11px] sm:text-sm font-bold border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Join</span>
              <ArrowRight className="hidden sm:block w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-5 rounded-full text-[11px] sm:text-sm font-bold bg-spotify-green text-black hover:bg-spotify-green/90 shadow-[0_0_20px_rgba(30,215,96,0.15)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Create</span>
              <ArrowRight className="hidden sm:block w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Bottom edge gradient */}
        <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </motion.div>

      <JoinRoomModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
      <CreateRoomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}

export const MultiplayerBanner = memo(MultiplayerBannerComponent);
