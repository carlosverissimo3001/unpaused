'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, ChevronDown, ChevronUp, Check, Music2 } from 'lucide-react';
import { GuessWave } from '@/components/history/GuessWave';
import { Button } from '@/components/ui/button';
import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';
import {
  GameHistoryEntryDtoStatusEnum,
  type GameHistoryEntryDto,
} from '@/sdk/models/GameHistoryEntryDto';
import { formatDate } from '@/utils/date-utils';
import { toOrdinal } from '../../utils/text-utils';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';
import { cardVariants } from './card-motion';

const GUESS_LABEL: Record<string, string> = {
  [GuessHistoryDtoResultEnum.Correct]: 'Correct',
  [GuessHistoryDtoResultEnum.Artist]: 'Same artist',
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: 'Same artist & album',
  [GuessHistoryDtoResultEnum.Album]: 'Same album',
  [GuessHistoryDtoResultEnum.Wrong]: 'Wrong',
  [GuessHistoryDtoResultEnum.Skip]: 'Skipped',
};

const GUESS_BORDER: Record<string, string> = {
  [GuessHistoryDtoResultEnum.Correct]: 'border-l-green-500',
  [GuessHistoryDtoResultEnum.Artist]: 'border-l-yellow-500',
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: 'border-l-yellow-500',
  [GuessHistoryDtoResultEnum.Album]: 'border-l-yellow-500',
  [GuessHistoryDtoResultEnum.Wrong]: 'border-l-red-500',
  [GuessHistoryDtoResultEnum.Skip]: 'border-l-white/30',
};

const POINTS_BADGE_CLASSES: Record<string, string> = {
  [GameHistoryEntryDtoStatusEnum.Won]:
    'bg-spotify-green/10 border-spotify-green/20 text-spotify-green',
  [GameHistoryEntryDtoStatusEnum.Lost]:
    'bg-red-500/10 border-red-500/20 text-red-400',
  [GameHistoryEntryDtoStatusEnum.Abandoned]: 'bg-fg/10 border-fg/20 text-fg/50',
};

const STATUS_SIDEBAR_CLASSES: Record<string, string> = {
  [GameHistoryEntryDtoStatusEnum.Won]: 'bg-spotify-green',
  [GameHistoryEntryDtoStatusEnum.Lost]: 'bg-red-500',
  [GameHistoryEntryDtoStatusEnum.Abandoned]: 'bg-fg/30',
};

interface HistoryCardProps {
  entry: GameHistoryEntryDto;
  onShare: (id: string) => void;
  copied: boolean;
  showWinnerGlow?: boolean;
  staggerIndex?: number;
}

const getPointsInfo = (entry: GameHistoryEntryDto, guessesUsed: number) => {
  if (entry.status === GameHistoryEntryDtoStatusEnum.Won) {
    return `${toOrdinal(guessesUsed)} Guess`;
  }
  if (entry.status === GameHistoryEntryDtoStatusEnum.Abandoned) {
    return 'Abandoned';
  }
  return 'Lost';
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

  // Note: maybe simplify this logic in the future
  const guessesUsed =
    isWon && entry.score != null && entry.score >= 1 && entry.score <= 6
      ? 7 - entry.score
      : (entry.score ?? 0);

  const actualGuesses = entry.guesses.filter(
    (g) => g.result !== GuessHistoryDtoResultEnum.Skip,
  );

  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.97 }}
      custom={staggerIndex}
      className={`group rounded-2xl bg-fg/[0.03] border overflow-hidden backdrop-blur-sm transition-all duration-300 cursor-pointer ${
        showWinnerGlow
          ? 'border-amber-400/30 shadow-[0_0_15px_rgba(30,215,96,0.1)]'
          : 'border-fg/10'
      }`}
    >
      <div className="flex">
        {/* Status Side-Bar */}
        <div
          className={`w-1 shrink-0 ${STATUS_SIDEBAR_CLASSES[entry.status]}`}
        />

        <div className="p-4 flex-1 min-w-0">
          <div className="flex gap-4 items-start">
            {/* Album Art */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-fg/10 shrink-0 shadow-lg">
              {entry.albumImageUrl ? (
                <Image
                  src={entry.albumImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-fg/20" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${entry.mode === GameMode.Daily ? 'text-spotify-green' : 'text-fg/40'}`}
                >
                  {formatDate(entry.date)}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${POINTS_BADGE_CLASSES[entry.status]}`}
                  >
                    {getPointsInfo(entry, guessesUsed)}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-fg truncate text-sm sm:text-base">
                {entry.trackName}
              </h3>
              <p className="text-xs sm:text-sm text-fg/50 truncate mb-3">
                by {entry.artistName}
              </p>

              <div className="flex items-center justify-between gap-2">
                <GuessWave results={entry.guesses.map((g) => g.result)} />

                <div className="flex items-center gap-1">
                  {actualGuesses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(!expanded)}
                      className="h-8 px-2 text-xs text-fg/40 hover:text-fg"
                    >
                      {expanded ? (
                        <ChevronUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      )}
                      {expanded ? 'Hide' : 'Guesses'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-colors ${copied ? 'text-spotify-green' : 'text-fg/40'}`}
                    onClick={() => onShare(entry.id)}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Guesses Logic */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-fg/5 space-y-1.5">
                  {actualGuesses.map((g, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-fg/[0.02] border-l-2 ${GUESS_BORDER[g.result]}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-fg/90 truncate font-medium">
                          {g.trackName}
                        </p>
                        <p className="text-[10px] text-fg/40 truncate">
                          by {g.artistName}
                        </p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-fg/30 whitespace-nowrap">
                        {GUESS_LABEL[g.result]}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
