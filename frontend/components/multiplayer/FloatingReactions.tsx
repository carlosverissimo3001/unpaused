'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import type { Reaction } from '@/hooks/multiplayer/useMultiplayerSocket';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

let nextId = 0;

export function useFloatingReactions() {
  const [floats, setFloats] = useState<FloatingEmoji[]>([]);

  const spawn = useCallback((reaction: Reaction) => {
    const id = nextId++;
    const x = 20 + Math.random() * 60; // 20-80% of container width
    setFloats((prev) => [...prev, { id, emoji: reaction.emoji, x }]);

    // Auto-remove after animation completes
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1800);
  }, []);

  const spawnOwn = useCallback((emoji: string) => {
    const id = nextId++;
    const x = 20 + Math.random() * 60;
    setFloats((prev) => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1800);
  }, []);

  return { floats, spawn, spawnOwn };
}

interface FloatingReactionsProps {
  floats: FloatingEmoji[];
}

export function FloatingReactions({ floats }: FloatingReactionsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {floats.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: '85vh', scale: 1 }}
            animate={{
              opacity: [1, 1, 0],
              y: '15vh',
              scale: [1, 1.3, 0.9],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute text-3xl"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
