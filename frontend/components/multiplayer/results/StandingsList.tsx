import { motion } from 'framer-motion';
import type { ScoreboardPlayerTotalDto } from '@/sdk';
import { StandingsItem } from './StandingsItem';

interface StandingsListProps {
  standings: ScoreboardPlayerTotalDto[];
  ranks: number[];
  currentUserId?: string;
}

export function StandingsList({
  standings,
  ranks,
  currentUserId,
}: StandingsListProps) {
  const maxScore = standings[0]?.totalScore ?? 0;

  return (
    <motion.div
      role="list"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.09,
            delayChildren: 0.15,
          },
        },
      }}
      className="mb-8 space-y-3"
    >
      {standings.map((player, index) => (
        <StandingsItem
          key={player.userId}
          player={player}
          rank={ranks[index]}
          isCurrentUser={player.userId === currentUserId}
          maxScore={maxScore}
        />
      ))}
    </motion.div>
  );
}
