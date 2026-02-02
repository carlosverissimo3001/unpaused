"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, ChevronDown, ChevronUp, Check, Music2 } from "lucide-react";
import { GuessPattern } from "@/components/daily/GuessPattern";
import { Button } from "@/components/ui/button";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";
import {
  GameHistoryEntryDtoStatusEnum,
  type GameHistoryEntryDto,
} from "@/sdk/models/GameHistoryEntryDto";

const GUESS_LABEL: Record<string, string> = {
  [GuessHistoryDtoResultEnum.Correct]: "Correct",
  [GuessHistoryDtoResultEnum.Artist]: "Same artist",
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: "Same artist & album",
  [GuessHistoryDtoResultEnum.Album]: "Same album",
  [GuessHistoryDtoResultEnum.Wrong]: "Wrong",
  [GuessHistoryDtoResultEnum.Skip]: "Skipped",
};

interface HistoryCardProps {
  entry: GameHistoryEntryDto;
  onShare: (id: string) => void;
  copied: boolean;
  showWinnerGlow?: boolean;
  staggerIndex?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export function HistoryCard({
  entry,
  onShare,
  copied,
  showWinnerGlow = false,
  staggerIndex = 0,
}: HistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isWon = entry.status === GameHistoryEntryDtoStatusEnum.Won;
  const score = entry.score ?? 0;

  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={staggerIndex}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group rounded-2xl bg-white/[0.03] border overflow-hidden backdrop-blur-sm transition-colors duration-200 hover:border-white/20 flex ${
        showWinnerGlow
          ? "border-amber-400/30 shadow-[0_0_15px_rgba(30,215,96,0.1)] hover:shadow-[0_0_20px_rgba(30,215,96,0.15)]"
          : "border-white/10"
      }`}
    >
      {/* Vertical status bar */}
      <div
        className={`w-1 shrink-0 ${isWon ? "bg-spotify-green/80" : "bg-red-500/80"}`}
        aria-hidden
      />
      <div className="p-4 sm:p-5 flex-1 min-w-0">
        <div className="flex gap-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white/10 shrink-0 shadow-lg">
            {entry.albumImageUrl ? (
              <Image
                src={entry.albumImageUrl}
                alt={`${entry.trackName} by ${entry.artistName}`}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Music2 className="w-10 h-10 text-white/20" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest text-white/50">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {entry.playlistName && (
                  <span className="inline-block mt-1 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/70 truncate max-w-full">
                    {entry.playlistName}
                  </span>
                )}
                {entry.isDaily && (
                  <span className="inline-block mt-1 ml-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green">
                    Daily
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                    isWon ? "bg-spotify-green/25 text-green-300" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {isWon ? `${score}/6` : "Lost"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onShare(entry.id)}
                  className={copied ? "bg-spotify-green/30 text-spotify-green" : "text-white/80"}
                  aria-label={copied ? "Copied!" : "Share"}
                >
                  {copied ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <h3 className="mt-2 font-semibold text-white truncate">{entry.trackName}</h3>
            <p className="text-sm text-white/60 truncate">by {entry.artistName}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <GuessPattern results={entry.guesses.map((g) => g.result)} className="text-lg" />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide guesses
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show guesses
              </>
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                {entry.guesses.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-white/5"
                  >
                    <span className="truncate text-sm text-white/90">
                      {g.result === GuessHistoryDtoResultEnum.Skip ? "Skipped" : g.trackName}
                    </span>
                    <span className="font-black text-[10px] uppercase tracking-widest text-white/50 shrink-0">
                      {GUESS_LABEL[g.result] ?? g.result}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
