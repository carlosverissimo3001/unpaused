import Image from 'next/image';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RoomPlayerDto } from '@/sdk';

type PlayerRowProps = {
  player: RoomPlayerDto;
  isHost: boolean;
  isCurrentUser: boolean;
  index: number;
};

function PlayerRow(props: PlayerRowProps) {
  const { player, isHost, isCurrentUser, index } = props;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 px-4 py-3.5"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {player.avatarUrl ? (
          <Image
            src={player.avatarUrl}
            alt={player.displayName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/10 flex items-center justify-center text-sm font-bold text-white/60">
            {player.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {isHost && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
            <Crown className="w-3 h-3 text-yellow-900" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {player.displayName}
          {isCurrentUser && (
            <span className="ml-2 text-xs font-normal text-white/30">
              (you)
            </span>
          )}
        </p>
      </div>

      {/* Host badge */}
      {isHost && (
        <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold text-yellow-500/80 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          Host
        </span>
      )}
    </motion.div>
  );
}

export default PlayerRow;
