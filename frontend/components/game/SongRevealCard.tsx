'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Pause, ExternalLink, Disc3 } from 'lucide-react';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import type { MetaGameExtrasVo, TrackOptionDto } from '@/sdk';
import { GuessPattern } from './GuessPattern';
import { ShareButton } from '@/components/daily/ShareButton';
import { triggerRevealConfetti } from './confetti';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { VolumeSlider } from './VolumeSlider';
import { GLASS_STYLE } from '@/lib/styles';

interface SongRevealCardProps {
  status: string;
  answer: TrackOptionDto | null | undefined;
  guesses: Array<{ result: string }>;
  previewUrl?: string | null;
  shareGameId?: string | null;
  showViewStats?: boolean;
  showPlayAgain?: boolean;
  onPlayAgain?: () => void;
  playlistExternalUrl?: string | null;
  playlistName?: string | null;
  playlistTotalTracks?: number | null;
  playlistImageUrl?: string | null;
  isFullSongPlaying: boolean;
  onToggleFullSong: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  /** Easter egg: personalized rank for special users */
  rankTitle?: string | null;
  /** Easter egg: personalized note for special users */
  specialNote?: string | null;
  /** easter eggs for win celebration */
  meta?: MetaGameExtrasVo;
}

export function SongRevealCard({
  status,
  answer,
  guesses,
  previewUrl,
  shareGameId,
  showViewStats,
  showPlayAgain,
  onPlayAgain,
  playlistExternalUrl,
  playlistName,
  playlistTotalTracks,
  playlistImageUrl,
  isFullSongPlaying,
  onToggleFullSong,
  volume,
  onVolumeChange,
  rankTitle,
  specialNote,
  meta,
}: SongRevealCardProps) {
  const songSpotifyUrl = answer
    ? `https://open.spotify.com/track/${answer.id}`
    : undefined;
  const isWon = status === GameStateDtoStatusEnum.Won;
  const albumColor = useImageColor(answer?.albumImageUrl ?? null);
  const albumGlowColor = albumColor.replace(/[\d.]+\)$/, '0.5)');
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (isWon && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      triggerRevealConfetti();
    }
  }, [isWon]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-6 md:mb-8 p-6 md:p-8 rounded-2xl text-center relative overflow-hidden"
      style={GLASS_STYLE}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight flex items-center justify-center gap-1 flex-wrap">
        <span
          style={{
            background: isWon
              ? 'linear-gradient(135deg, #1DB954 0%, #1ed760 50%, #91ed91 100%)'
              : 'linear-gradient(135deg, rgb(var(--fg) / 0.6) 0%, rgb(var(--fg) / 0.85) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {isWon ? 'You Won' : 'Game Over'}
        </span>
        {isWon && (
          <motion.span
            className="inline-block text-[#f472b6]"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {meta?.winEmoji}
          </motion.span>
        )}
      </h2>
      {(rankTitle || specialNote) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="mb-4 md:mb-6 space-y-1"
        >
          {rankTitle && (
            <p className="text-sm font-medium text-fg/50">{rankTitle}</p>
          )}
          {specialNote && (
            <p className="text-xs text-fg/40 italic">{specialNote}</p>
          )}
        </motion.div>
      )}
      {answer && (
        <div className="mb-4 md:mb-6">
          {answer.albumImageUrl && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                scale: { type: 'spring', stiffness: 260, damping: 20 },
                opacity: { duration: 0.35 },
              }}
              className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-3 md:mb-4 rounded-xl overflow-visible"
              style={{
                filter: `drop-shadow(0 0 28px 12px ${albumGlowColor})`,
              }}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-fg/10">
                <Image
                  src={answer.albumImageUrl}
                  alt={answer.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </div>
            </motion.div>
          )}
          <motion.p
            className="text-fg/50 text-sm mb-1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            The song was
          </motion.p>
          <motion.p
            className="font-semibold text-lg md:text-xl text-fg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {answer.name}
          </motion.p>
          <motion.p
            className="text-fg/50 text-sm"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            by {answer.artist}
          </motion.p>
        </div>
      )}
      <GuessPattern
        results={guesses.map((g) => g.result)}
        className="justify-center mb-4"
      />
      <div className="flex flex-wrap justify-center gap-3">
        {shareGameId && <ShareButton gameId={shareGameId} variant="default" />}
        {showViewStats && (
          <Link href="/daily/stats">
            <motion.span
              className="inline-block px-4 py-2 rounded-full bg-fg/10 hover:bg-fg/20 text-sm font-medium text-fg border border-fg/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Stats
            </motion.span>
          </Link>
        )}
        {showPlayAgain && onPlayAgain && (
          <motion.button
            type="button"
            onClick={onPlayAgain}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold transition-colors"
          >
            Play Again
          </motion.button>
        )}
      </div>
      {previewUrl && (
        <div className="mt-4 w-fit mx-auto flex items-center gap-2">
          <motion.button
            type="button"
            onClick={onToggleFullSong}
            className="p-2.5 rounded-full bg-fg/10 hover:bg-fg/20 border border-fg/10 transition-colors"
            aria-label={isFullSongPlaying ? 'Pause' : 'Play'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFullSongPlaying ? (
              <motion.span whileHover={{ rotate: 5 }}>
                <Pause className="w-5 h-5 text-fg" />
              </motion.span>
            ) : (
              <motion.span whileHover={{ rotate: 5 }}>
                <Play className="w-5 h-5 text-fg" />
              </motion.span>
            )}
          </motion.button>
          <VolumeSlider volume={volume} onVolumeChange={onVolumeChange} />
        </div>
      )}

      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mt-6 pt-6 border-t border-fg/10 space-y-3"
        >
          <p className="text-sm text-fg/50 mb-3">Listen on Spotify:</p>

          {songSpotifyUrl && (
            <a
              href={songSpotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-fg/5 hover:bg-fg/10 border border-fg/10 text-fg transition-colors group w-full max-w-md mx-auto"
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-fg/10 flex-shrink-0">
                {answer.albumImageUrl ? (
                  <Image
                    src={answer.albumImageUrl}
                    alt={answer.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.span whileHover={{ rotate: 15 }}>
                      <Play className="w-5 h-5 text-fg/40" />
                    </motion.span>
                  </div>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{answer.name}</p>
                  <span className="bg-[#1DB954] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    SONG
                  </span>
                </div>
                <p className="text-xs text-fg/50 truncate">
                  by {answer.artist}
                </p>
              </div>
              <motion.span
                className="flex-shrink-0"
                whileHover={{ rotate: 15 }}
              >
                <ExternalLink className="w-4 h-4 text-fg/50 group-hover:text-fg" />
              </motion.span>
            </a>
          )}

          {answer.albumUrl && (
            <a
              href={answer.albumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-fg/5 hover:bg-fg/10 border border-fg/10 text-fg transition-colors group w-full max-w-md mx-auto"
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-fg/10 flex-shrink-0">
                {answer.albumImageUrl ? (
                  <Image
                    src={answer.albumImageUrl}
                    alt={answer.albumName || 'Album'}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.span whileHover={{ rotate: 15 }}>
                      <Disc3 className="w-5 h-5 text-fg/40" />
                    </motion.span>
                  </div>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {answer.albumName || 'Album'}
                  </p>
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ALBUM
                  </span>
                </div>
                <p className="text-xs text-fg/50 truncate">{answer.artist}</p>
              </div>
              <motion.span
                className="flex-shrink-0"
                whileHover={{ rotate: 15 }}
              >
                <ExternalLink className="w-4 h-4 text-fg/50 group-hover:text-fg" />
              </motion.span>
            </a>
          )}
        </motion.div>
      )}

      {playlistExternalUrl && playlistName != null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-fg/10"
        >
          <p className="text-sm text-fg/50 mb-3">
            Listen to the full playlist:
          </p>
          <a
            href={playlistExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-fg/5 hover:bg-fg/10 border border-fg/10 text-fg transition-colors group w-full max-w-md mx-auto"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-fg/10 flex-shrink-0">
              {playlistImageUrl ? (
                <Image
                  src={playlistImageUrl}
                  alt={playlistName}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center min-w-[40px] min-h-[40px]">
                  <motion.span whileHover={{ rotate: 15 }}>
                    <Play className="w-5 h-5 text-fg/40" />
                  </motion.span>
                </div>
              )}
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{playlistName}</p>
              {playlistTotalTracks != null && (
                <p className="text-xs text-fg/50">
                  {playlistTotalTracks} tracks
                </p>
              )}
            </div>
            <motion.span
              className="ml-auto flex-shrink-0"
              whileHover={{ rotate: 15 }}
            >
              <ExternalLink className="w-4 h-4 text-fg/50 group-hover:text-fg" />
            </motion.span>
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}
