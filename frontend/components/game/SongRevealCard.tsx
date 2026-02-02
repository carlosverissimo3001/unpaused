"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, ExternalLink, Disc3 } from "lucide-react";
import { GameStateDtoStatusEnum } from "@/sdk/models/GameStateDto";
import type { TrackOptionDto } from "@/sdk";
import { GuessPattern } from "./GuessPattern";
import { ShareButton } from "@/components/daily/ShareButton";

interface SongRevealCardProps {
  status: string;
  answer: TrackOptionDto | null | undefined;
  guesses: Array<{ result: string }>;
  previewUrl?: string | null;
  /** When set, show Share Result button (daily game id) */
  shareGameId?: string | null;
  /** When true, show View Stats link (daily) */
  showViewStats?: boolean;
  /** When true, show Play Again / Home (playlist mode) */
  showPlayAgain?: boolean;
  onPlayAgain?: () => void;
  /** Optional playlist info for "Listen to the full playlist" (playlist mode) */
  playlistExternalUrl?: string | null;
  playlistName?: string | null;
  playlistTotalTracks?: number | null;
  playlistImageUrl?: string | null;
  isFullSongPlaying: boolean;
  isMuted: boolean;
  onToggleFullSong: () => void;
  onToggleMute: () => void;
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
  isMuted,
  onToggleFullSong,
  onToggleMute,
}: SongRevealCardProps) {
  const songSpotifyUrl = answer ? `https://open.spotify.com/track/${answer.id}` : undefined;
  const isWon = status === GameStateDtoStatusEnum.Won;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mb-6 md:mb-8 p-6 md:p-8 bg-white/10 rounded-xl text-center"
    >
      <h2 className="text-xl md:text-2xl font-bold mb-4">{isWon ? "You won!" : "Game over"}</h2>
      {answer && (
        <div className="mb-4 md:mb-6">
          {answer.albumImageUrl && (
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-3 md:mb-4 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={answer.albumImageUrl}
                alt={answer.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 160px"
              />
            </div>
          )}
          <p className="text-white/60 text-sm">The song was</p>
          <p className="font-semibold text-lg md:text-xl">{answer.name}</p>
          <p className="text-white/60 text-sm">by {answer.artist}</p>
        </div>
      )}
      <GuessPattern results={guesses.map((g) => g.result)} className="justify-center mb-4" />
      <div className="flex flex-wrap justify-center gap-3">
        {shareGameId && <ShareButton gameId={shareGameId} variant="default" />}
        {showViewStats && (
          <Link href="/daily/stats">
            <span className="inline-block px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
              View Stats
            </span>
          </Link>
        )}
        {showPlayAgain && onPlayAgain && (
          <button
            type="button"
            onClick={onPlayAgain}
            className="px-4 py-2 rounded-full bg-spotify-green hover:bg-green-400 text-black font-medium transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
      {previewUrl && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={onToggleFullSong}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label={isFullSongPlaying ? "Pause" : "Play"}
          >
            {isFullSongPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      )}

      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 pt-6 border-t border-white/10 space-y-3"
        >
          <p className="text-sm text-white/50 mb-3">Listen on Spotify:</p>

          {songSpotifyUrl && (
            <a
              href={songSpotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group w-full max-w-md mx-auto"
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
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
                    <Play className="w-5 h-5 text-white/40" />
                  </div>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{answer.name}</p>
                  <span className="bg-spotify-green text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    SONG
                  </span>
                </div>
                <p className="text-xs text-white/60 truncate">by {answer.artist}</p>
              </div>
              <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          )}

          {answer.albumUrl && (
            <a
              href={answer.albumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group w-full max-w-md mx-auto"
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                {answer.albumImageUrl ? (
                  <Image
                    src={answer.albumImageUrl}
                    alt={answer.albumName || "Album"}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-5 h-5 text-white/40" />
                  </div>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{answer.albumName || "Album"}</p>
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ALBUM
                  </span>
                </div>
                <p className="text-xs text-white/60 truncate">{answer.artist}</p>
              </div>
              <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          )}
        </motion.div>
      )}

      {playlistExternalUrl && playlistName != null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <p className="text-sm text-white/50 mb-3">Listen to the full playlist:</p>
          <a
            href={playlistExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group w-full max-w-md mx-auto"
          >
            <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
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
                  <Play className="w-5 h-5 text-white/40" />
                </div>
              )}
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{playlistName}</p>
              {playlistTotalTracks != null && (
                <p className="text-xs text-white/60">{playlistTotalTracks} tracks</p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}
