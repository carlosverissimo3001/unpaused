import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function WaitingForPlayers() {
  return (
    <div
      className="flex min-h-screen min-h-[100dvh] items-center justify-center"
      style={{ background: '#121212' }}
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

      <div className="relative z-10 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-4 inline-block"
        >
          <Loader2 className="h-8 w-8 text-[#1DB954]" />
        </motion.div>
        <h2 className="mb-2 text-xl font-bold text-white">
          Waiting for other players
        </h2>
        <p className="text-sm text-white/40">
          Results will appear once everyone finishes
        </p>
      </div>
    </div>
  );
}
