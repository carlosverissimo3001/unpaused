'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

const DEFAULT_REACTIONS = ['🔥', '💀', '😂', '👏', '😱', '🎵'];
const STORAGE_KEY = 'unpaused:reaction-slots';
const MAX_SLOTS = 6;
const COOLDOWN_MS = 500;

// Curated emoji grid — music/game/social reactions that make sense in context
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Reactions',
    emojis: ['🔥', '💀', '😂', '👏', '😱', '🤯', '😭', '🥶', '💅', '🙄', '😤', '🫠'],
  },
  {
    label: 'Vibes',
    emojis: ['🎵', '🎶', '🎧', '🎤', '🎸', '🥁', '🪩', '💃', '🕺', '✨', '💫', '⚡'],
  },
  {
    label: 'Competitive',
    emojis: ['🏆', '🥇', '🥈', '🥉', '💪', '👀', '🧠', '🎯', '💣', '🚀', '⏱️', '📈'],
  },
  {
    label: 'Smileys',
    emojis: ['😎', '🤓', '🥳', '🤡', '👻', '😈', '🤔', '😮‍💨', '🫡', '🫣', '🤭', '😏'],
  },
  {
    label: 'Hands',
    emojis: ['👍', '👎', '🤝', '🙏', '✌️', '🤟', '🫶', '👋', '💀', '❤️', '💔', '🖤'],
  },
];

function loadSlots(): string[] {
  if (typeof window === 'undefined') return DEFAULT_REACTIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed) && parsed.length === MAX_SLOTS) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_REACTIONS;
}

function saveSlots(slots: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    /* ignore */
  }
}

function promoteEmoji(slots: string[], emoji: string): string[] {
  const existing = slots.indexOf(emoji);
  if (existing !== -1) {
    const next = [...slots];
    next.splice(existing, 1);
    next.unshift(emoji);
    return next;
  }
  return [emoji, ...slots.slice(0, MAX_SLOTS - 1)];
}

interface ReactionBarProps {
  onReaction: (emoji: string) => void;
}

export function ReactionBar({ onReaction }: ReactionBarProps) {
  const [slots, setSlots] = useState(DEFAULT_REACTIONS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastSentRef = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSlots(loadSlots());
  }, []);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  // Close picker on Escape
  useEffect(() => {
    if (!pickerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [pickerOpen]);

  const send = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastSentRef.current < COOLDOWN_MS) return;
      lastSentRef.current = now;
      onReaction(emoji);
    },
    [onReaction],
  );

  const handleSlotClick = useCallback(
    (emoji: string) => {
      send(emoji);
    },
    [send],
  );

  const handlePickerSelect = useCallback(
    (emoji: string) => {
      send(emoji);
      setSlots((prev) => {
        const next = promoteEmoji(prev, emoji);
        saveSlots(next);
        return next;
      });
      setPickerOpen(false);
    },
    [send],
  );

  return (
    <div className="relative flex items-center justify-center gap-1.5">
      <AnimatePresence mode="popLayout">
        {slots.map((emoji, i) => (
          <motion.button
            key={`${emoji}-${i}`}
            layout
            type="button"
            onClick={() => handleSlotClick(emoji)}
            className="w-10 h-10 rounded-full bg-fg/5 border border-fg/10 text-lg flex items-center justify-center hover:bg-fg/10 hover:border-fg/20 transition-colors select-none"
            whileTap={{ scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {emoji}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* "+" button to open emoji picker popover */}
      <motion.button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors select-none ${
          pickerOpen
            ? 'bg-fg/10 border-fg/20 text-fg/60'
            : 'bg-fg/5 border-fg/10 text-fg/40 hover:bg-fg/10 hover:border-fg/20 hover:text-fg/60'
        }`}
        whileTap={{ scale: 0.8 }}
        title="More emojis"
      >
        <AnimatePresence mode="wait" initial={false}>
          {pickerOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Plus className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Emoji picker popover */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-14 right-0 z-50 w-72 rounded-2xl border border-fg/10 bg-bg/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-3 space-y-3 scrollbar-thin">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-fg/30 font-semibold mb-1.5 px-0.5">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-6 gap-1">
                    {cat.emojis.map((emoji) => {
                      const isInSlots = slots.includes(emoji);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handlePickerSelect(emoji)}
                          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors select-none hover:bg-fg/10 active:scale-90 ${
                            isInSlots ? 'bg-fg/5 ring-1 ring-fg/10' : ''
                          }`}
                          title={isInSlots ? 'Already in quick bar' : 'Send & add to quick bar'}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-fg/5 px-3 py-2">
              <p className="text-[10px] text-fg/25 text-center">
                Picked emojis replace your quick bar slots
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
