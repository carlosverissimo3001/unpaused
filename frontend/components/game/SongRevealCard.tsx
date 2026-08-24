'use client';

import { useState } from 'react';
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
import type { TrackOptionDto } from '@/sdk';
import { ShareButton } from '@/components/daily/ShareButton';

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
  /** Easter egg: personalized rank for special users */
  rankTitle?: string | null;
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
  rankTitle,
}: SongRevealCardProps) {
  // The backend supplies this. Building it from answer.id assumed every track
  // was a Spotify one, which silently 404s for guest-pool tracks.
  const songUrl = answer?.trackUrl;
  const isSpotifyLink = songUrl?.includes('open.spotify.com') ?? false;
  const linkBadgeClass = isSpotifyLink
    ? 'bg-[#1DB954] text-black'
    : 'bg-[#A238FF] text-white';
  // "Rick Ross" alone hides that Diced Pineapples is also Wale and Drake.
  const credited = answer?.allArtists?.length
    ? answer.allArtists.join(', ')
    : answer?.artist;
  const isWon = status === GameStateDtoStatusEnum.Won;

  const [albumLoaded, setAlbumLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-3 md:mb-4 p-6 md:p-8 rounded-2xl text-center relative overflow-hidden"
      style={GLASS_STYLE}
    >
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
        </h2>
        {rankTitle && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mb-4 md:mb-6 space-y-1"
          >
            {rankTitle && (
              <p className="text-sm font-medium text-fg/50">{rankTitle}</p>
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
                <div className="relative w-full h-full rounded-xl overflow-hidden">
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
              {credited}
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
              {answer && songUrl && (
                <a
                  href={songUrl}
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
                    <p className="text-xs text-fg/50 truncate">{credited}</p>
                  </div>
                  <span
                    className={`${linkBadgeClass} text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0`}
                  >
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
                    <p className="text-xs text-fg/50 truncate">{credited}</p>
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
