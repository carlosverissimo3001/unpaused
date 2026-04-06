'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ListMusic, Trophy, Zap, Check, ArrowLeft } from 'lucide-react';
import { useMyPlaylists } from '@/hooks/playlists/useMyPlaylists';
import { StartRunDtoDifficultyEnum as GauntletDifficulty } from '@/sdk';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DIFFICULTIES: {
  value: GauntletDifficulty;
  label: string;
  duration: string;
  description: string;
  color: string;
}[] = [
  {
    value: GauntletDifficulty.Easy,
    label: 'Easy',
    duration: '5s',
    description: 'Plenty of time',
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  },
  {
    value: GauntletDifficulty.Medium,
    label: 'Medium',
    duration: '3s',
    description: 'Standard',
    color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  },
  {
    value: GauntletDifficulty.Hard,
    label: 'Hard',
    duration: '2s',
    description: 'Think fast',
    color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
  },
  {
    value: GauntletDifficulty.Expert,
    label: 'Expert',
    duration: '1s',
    description: 'One second',
    color: 'from-red-500/20 to-red-500/5 border-red-500/30',
  },
];

interface SpeedRunSetupProps {
  onStart: (playlistId: string, difficulty: GauntletDifficulty) => void;
  isStarting: boolean;
  startError?: string;
  personalBest: number;
}

export function SpeedRunSetup({
  onStart,
  isStarting,
  startError,
  personalBest,
}: SpeedRunSetupProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<GauntletDifficulty>(GauntletDifficulty.Medium);

  const { data: playlistsData, isLoading: isLoadingPlaylists } = useMyPlaylists(
    { limit: 50 },
  );
  const playlists = playlistsData?.items ?? [];

  const canStart = !!selectedPlaylistId && !isStarting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Back Button */}
      <div className="flex items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
            The{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #fb923c, #ef4444)',
              }}
            >
              Speed Run
            </span>
          </h1>
          <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
        </div>
        <p className="text-fg/50 text-sm sm:text-base">
          One snippet. One chance. How far can you go?
        </p>
        {personalBest > 0 && (
          <p className="text-orange-400/80 text-sm font-semibold">
            Your best: {personalBest} 🔥
          </p>
        )}
        <Link
          href="/speed-run/leaderboard"
          className="inline-flex items-center gap-1.5 text-amber-400/70 hover:text-amber-400 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <Trophy className="w-3.5 h-3.5" />
          Leaderboard
        </Link>
      </div>

      {/* Difficulty */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg/40">
          Snippet Duration
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => (
            <motion.button
              key={d.value}
              onClick={() => setSelectedDifficulty(d.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border bg-gradient-to-b transition-all ${d.color} ${
                selectedDifficulty === d.value
                  ? 'ring-2 ring-offset-1 ring-offset-transparent'
                  : 'opacity-60 hover:opacity-80'
              }`}
              style={{}}
            >
              {selectedDifficulty === d.value && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" strokeWidth={3} />
                </span>
              )}
              <span className="text-base sm:text-lg font-black tabular-nums">
                {d.duration}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-fg/50">
                {d.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Playlist selection */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg/40">
          Choose a Playlist
        </h2>

        {isLoadingPlaylists ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
            {playlists.map((playlist) => {
              const isSelected = selectedPlaylistId === playlist.id;
              return (
                <motion.button
                  key={playlist.id}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex flex-col rounded-xl overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-orange-500/60 ring-2 ring-orange-500/40'
                      : 'border-fg/10 hover:border-fg/20'
                  }`}
                >
                  {/* Album art */}
                  <div className="relative aspect-square w-full bg-fg/5">
                    {playlist.imageUrl ? (
                      <Image
                        src={playlist.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic className="w-6 h-6 text-fg/20" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                          <Check
                            className="w-3.5 h-3.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <div className="px-1.5 py-1 bg-surface/60">
                    <p className="text-[10px] font-semibold text-fg/80 truncate leading-tight">
                      {playlist.name}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {startError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm text-center"
          >
            {startError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Start CTA */}
      <motion.button
        onClick={() => {
          if (canStart) onStart(selectedPlaylistId!, selectedDifficulty);
        }}
        disabled={!canStart}
        whileHover={canStart ? { scale: 1.02 } : {}}
        whileTap={canStart ? { scale: 0.98 } : {}}
        className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all ${
          canStart
            ? 'text-white shadow-[0_0_30px_rgba(251,146,60,0.3)] active:scale-95'
            : 'opacity-30 cursor-not-allowed text-fg/50 bg-fg/10'
        }`}
        style={
          canStart
            ? { background: 'linear-gradient(135deg, #f97316, #ef4444)' }
            : {}
        }
      >
        {isStarting ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Starting…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 fill-current" />
            Start Speed Run
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}
