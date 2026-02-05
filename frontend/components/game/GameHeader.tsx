"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Play, ExternalLink, BarChart3, History } from "lucide-react";
import { StreakBadge } from "@/components/daily/StreakBadge";
import type { PlaylistDto, GameStatsDto } from "@/sdk";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";


interface GameHeaderProps {
  mode: GameMode;
  playlist?: PlaylistDto | null;
  stats?: GameStatsDto | null;
}

export function GameHeader({ mode, playlist, stats }: GameHeaderProps) {
  const isPlaylist = mode === GameMode.All;
  const isDaily = mode === GameMode.Daily;

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </Link>
      {isPlaylist && playlist && (
        <div className="flex items-center gap-2.5 ml-2 min-w-0">
          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
            {playlist.imageUrl ? (
              <Image
                src={playlist.imageUrl}
                alt={playlist.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-4 h-4 text-white/40" />
              </div>
            )}
          </div>
          <a
            href={playlist.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group text-sm text-white/40 hover:text-white/80 transition-colors truncate flex items-center gap-1.5"
          >
            <span className="truncate max-w-[180px]">{playlist.name}</span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )}
      {isDaily && (
        <div className="flex items-center gap-4">
          {stats && (
            <StreakBadge currentStreak={stats.currentStreak} bestStreak={stats.bestStreak} />
          )}
          <Link
            href="/daily/stats"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </Link>
          <Link
            href="/history?filter=daily"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </div>
      )}
    </div>
    );
  }
