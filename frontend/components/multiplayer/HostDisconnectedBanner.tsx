import { motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function HostDisconnectedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 flex items-center gap-3"
    >
      <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
      <p className="text-sm text-yellow-200">
        The host appears to have disconnected
      </p>
    </motion.div>
  );
}
