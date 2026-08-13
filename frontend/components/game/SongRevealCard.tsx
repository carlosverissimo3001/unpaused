'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  ExternalLink,
  Disc3,
  Music,
  ListMusic,
} from 'lucide-react';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import type { MetaGameExtrasVo, TrackOptionDto } from '@/sdk';
import { ShareButton } from '@/components/daily/ShareButton';
import { triggerRevealConfetti } from './confetti';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { VolumeSlider } from './VolumeSlider';
import { GLASS_STYLE } from '@/lib/styles';

interface SongRevealCardProps {
  status: string;
  answer: TrackOptionDto | null | undefined;
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

function extractRgb(rgba: string): { r: number; g: number; b: number } | null {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return { r: +match[1], g: +match[2], b: +match[3] };
}

export function SongRevealCard({
  status,
  answer,
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
  const albumRgb = extractRgb(albumColor);
  const albumGlowColor = albumRgb
    ? `rgba(${albumRgb.r}, ${albumRgb.g}, ${albumRgb.b}, 0.5)`
    : 'rgba(29, 185, 84, 0.3)';
  const ambientGradient = albumRgb
    ? `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${albumRgb.r}, ${albumRgb.g}, ${albumRgb.b}, 0.12) 0%, transparent 70%)`
    : 'none';
  const confettiFiredRef = useRef(false);
  const [albumLoaded, setAlbumLoaded] = useState(false);

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
      className="mb-3 md:mb-4 p-6 md:p-8 rounded-2xl text-center relative overflow-hidden"
      style={GLASS_STYLE}
    >
      {/* Ambient color wash from album art */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{ background: ambientGradient }}
      />

      <div className="relative z-10">
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
          <div className="mb-5 md:mb-6">
            {answer.albumImageUrl && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  scale: { type: 'spring', stiffness: 260, damping: 20 },
                  opacity: { duration: 0.35 },
                }}
                className="relative w-36 h-36 md:w-44 md:h-44 mx-auto mb-4 md:mb-5"
              >
                {/* Colored glow behind album art */}
                <div
                  className="absolute -inset-4 rounded-3xl blur-2xl opacity-60 transition-colors duration-700"
                  style={{
                    background: `radial-gradient(circle, ${albumGlowColor} 0%, transparent 70%)`,
                  }}
                />
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  {!albumLoaded && (
                    <div className="absolute inset-0 animate-pulse bg-fg/10" />
                  )}
                  <Image
                    src={answer.albumImageUrl}
                    alt={answer.name}
                    fill
                    className={`object-cover transition-opacity duration-300 ${albumLoaded ? 'opacity-100' : 'opacity-0'}`}
                    sizes="(max-width: 768px) 144px, 176px"
                    priority
                    onLoad={() => setAlbumLoaded(true)}
                    onError={() => setAlbumLoaded(true)}
                  />
                </div>
              </motion.div>
            )}
            <motion.p
              className="font-semibold text-lg md:text-xl text-fg"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {answer.name}
            </motion.p>
            <motion.p
              className="text-fg/50 text-sm mt-0.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              {answer.artist}
            </motion.p>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {previewUrl && (
            <>
              <motion.button
                type="button"
                onClick={onToggleFullSong}
                className="p-2.5 rounded-full bg-fg/10 hover:bg-fg/20 border border-fg/10 transition-colors"
                aria-label={isFullSongPlaying ? 'Pause' : 'Play'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFullSongPlaying ? (
                  <Pause className="w-5 h-5 text-fg" />
                ) : (
                  <Play className="w-5 h-5 text-fg" />
                )}
              </motion.button>
              <VolumeSlider volume={volume} onVolumeChange={onVolumeChange} />
            </>
          )}
          {shareGameId && (
            <ShareButton gameId={shareGameId} variant="default" />
          )}
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

        {(answer || (playlistExternalUrl && playlistName != null)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
            className="mt-6 pt-6 border-t border-fg/10"
          >
            <div className="w-full max-w-md mx-auto rounded-xl border border-fg/10 overflow-hidden divide-y divide-fg/10">
              {answer && songSpotifyUrl && (
                <a
                  href={songSpotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-fg/5 hover:bg-fg/10 text-fg transition-colors group"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-fg/10 flex-shrink-0">
                    {answer.albumImageUrl ? (
                      <Image
                        src={answer.albumImageUrl}
                        alt={answer.name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-fg/40" />
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {answer.name}
                    </p>
                    <p className="text-xs text-fg/50 truncate">
                      {answer.artist}
                    </p>
                  </div>
                  <span className="bg-[#1DB954] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    SONG
                  </span>
                  <ExternalLink className="w-4 h-4 text-fg/50 group-hover:text-fg flex-shrink-0" />
                </a>
              )}
              {answer?.albumUrl && (
                <a
                  href={answer.albumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-fg/5 hover:bg-fg/10 text-fg transition-colors group"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-fg/10 flex-shrink-0">
                    {answer.albumImageUrl ? (
                      <Image
                        src={answer.albumImageUrl}
                        alt={answer.albumName || 'Album'}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-4 h-4 text-fg/40" />
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {answer.albumName || 'Album'}
                    </p>
                    <p className="text-xs text-fg/50 truncate">
                      {answer.artist}
                    </p>
                  </div>
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ALBUM
                  </span>
                  <ExternalLink className="w-4 h-4 text-fg/50 group-hover:text-fg flex-shrink-0" />
                </a>
              )}
              {playlistExternalUrl && playlistName != null && (
                <a
                  href={playlistExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-fg/5 hover:bg-fg/10 text-fg transition-colors group"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-fg/10 flex-shrink-0">
                    {playlistImageUrl ? (
                      <Image
                        src={playlistImageUrl}
                        alt={playlistName}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic className="w-4 h-4 text-fg/40" />
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {playlistName}
                    </p>
                    {playlistTotalTracks != null && (
                      <p className="text-xs text-fg/50">
                        {playlistTotalTracks} tracks
                      </p>
                    )}
                  </div>
                  <span className="bg-fg/20 text-fg text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    PLAYLIST
                  </span>
                  <ExternalLink className="w-4 h-4 text-fg/50 group-hover:text-fg flex-shrink-0" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
