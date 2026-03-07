'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, X, Disc3 } from 'lucide-react';
import type { TrackOptionDto } from '@/sdk';
import { MIN_QUERY_LENGTH } from '@/consts/consts';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';

export interface GuessSearchState {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  selectedTrack: TrackOptionDto | null;
  filteredTracks: TrackOptionDto[];
  isLoading: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  handleSelectTrack: (track: TrackOptionDto) => void;
  handleClearSelection: () => void;
}

interface GuessInputProps {
  search: GuessSearchState;
  onSubmit: () => void;
  onSkip: () => void;
  submitPending: boolean;
}

export function GuessInput({
  search,
  onSubmit,
  onSkip,
  submitPending,
}: GuessInputProps) {
  const {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    selectedTrack,
    filteredTracks,
    isLoading,
    searchRef,
    handleSelectTrack,
    handleClearSelection,
  } = search;

  const dropdownOpen = showDropdown && searchQuery.length > 0 && !selectedTrack;

  return (
    <div
      className="rounded-2xl p-3 sm:p-4 space-y-3"
      style={{
        background: 'rgb(var(--fg) / 0.05)',
        border: '1px solid rgb(var(--fg) / 0.09)',
      }}
    >
      <Popover open={dropdownOpen} modal={false}>
        <div ref={searchRef}>
          {selectedTrack ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl text-black min-h-[56px]"
              style={{
                background: '#1DB954',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 20px rgba(29,185,84,0.3)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedTrack.name}</p>
                <p className="text-sm text-black/70 truncate">
                  {selectedTrack.artist}
                </p>
              </div>
              <motion.button
                type="button"
                onClick={handleClearSelection}
                aria-label="Clear selection"
                className="p-2 hover:bg-black/10 rounded-full transition-colors"
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ) : (
            <PopoverAnchor asChild>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[#535353]">
                  <Search className="w-5 h-5 pointer-events-none" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search for a song..."
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-xl text-base text-fg placeholder-[#535353] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954]/50 transition-all min-h-[48px] touch-manipulation"
                  style={{
                    background: 'rgb(var(--fg) / 0.06)',
                    border: '1px solid rgb(var(--fg) / 0.08)',
                  }}
                />
              </div>
            </PopoverAnchor>
          )}
        </div>

        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width] overflow-hidden rounded-xl border border-fg/10 shadow-2xl"
          style={{
            background: 'rgb(var(--surface) / 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgb(var(--fg) / 0.06)',
            maxHeight: 'var(--radix-popover-content-available-height, 60vh)',
          }}
          side="bottom"
          avoidCollisions={false}
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (
              searchRef.current &&
              searchRef.current.contains(e.target as Node)
            ) {
              e.preventDefault();
              return;
            }
            setShowDropdown(false);
          }}
        >
          <div
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: 'inherit' }}
          >
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className="w-full p-3 sm:p-4 flex items-center gap-3 text-left hover:bg-fg/10 border-b border-fg/5 last:border-b-0 transition-colors first:rounded-t-xl last:rounded-b-xl min-h-[56px] touch-manipulation active:bg-fg/15"
                >
                  {track.albumImageUrl ? (
                    <Image
                      src={track.albumImageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-fg/10 flex items-center justify-center flex-shrink-0">
                      <Disc3 className="w-5 h-5 text-[#535353]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg truncate">{track.name}</p>
                    <p className="text-sm text-fg/50 truncate">
                      {track.artist}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-[#b3b3b3] text-center text-sm">
                {isLoading
                  ? 'Searching...'
                  : searchQuery.trim().length < MIN_QUERY_LENGTH
                    ? `Type at least ${MIN_QUERY_LENGTH} characters`
                    : 'No songs found'}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-col gap-2">
        <motion.button
          type="button"
          onClick={onSubmit}
          aria-label="Submit guess"
          disabled={!selectedTrack || submitPending}
          whileHover={selectedTrack && !submitPending ? { scale: 1.02 } : {}}
          whileTap={selectedTrack && !submitPending ? { scale: 0.98 } : {}}
          className={`w-full py-2.5 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all min-h-[40px] sm:min-h-[48px] touch-manipulation ${
            selectedTrack && !submitPending
              ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1DB954]/20 active:scale-95'
              : 'bg-fg/10 text-fg/30 border border-fg/[0.12] cursor-not-allowed'
          }`}
        >
          Submit
        </motion.button>
        <button
          type="button"
          onClick={onSkip}
          disabled={submitPending}
          aria-label="Skip round"
          className="text-fg/40 hover:text-fg/70 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors touch-manipulation"
        >
          Skip this round
        </button>
      </div>
    </div>
  );
}
