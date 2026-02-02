"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Disc3 } from "lucide-react";
import type { TrackOptionDto } from "@/sdk";

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

export function GuessInput({ search, onSubmit, onSkip, submitPending }: GuessInputProps) {
  const selectedTrack = search.selectedTrack;

  return (
    <>
      <div ref={search.searchRef} className="mb-4 relative">
        {selectedTrack ? (
          <div className="flex items-center gap-3 p-4 bg-spotify-green text-black rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedTrack.name}</p>
              <p className="text-sm text-black/70 truncate">{selectedTrack.artist}</p>
            </div>
            <button
              type="button"
              onClick={search.handleClearSelection}
              className="p-2 hover:bg-black/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
            <input
              type="text"
              value={search.searchQuery}
              onChange={(e) => {
                search.setSearchQuery(e.target.value);
                search.setShowDropdown(true);
              }}
              onFocus={() => search.setShowDropdown(true)}
              placeholder="Search for a song..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />
            <AnimatePresence>
              {search.showDropdown && search.searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 w-full mt-2 max-h-80 overflow-y-auto rounded-lg bg-zinc-800 border border-white/10 shadow-xl"
                >
                  {search.filteredTracks.length > 0 ? (
                    search.filteredTracks.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => search.handleSelectTrack(track)}
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/10 border-b border-white/5 last:border-b-0"
                      >
                        {track.albumImageUrl ? (
                          <Image
                            src={track.albumImageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Disc3 className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{track.name}</p>
                          <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-gray-400 text-center">
                      {search.isLoading
                        ? "Searching..."
                        : search.searchQuery.trim().length < 2
                        ? "Type at least 2 characters"
                        : "No songs found"}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onSkip}
          disabled={submitPending}
          className="flex-1 py-3 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 disabled:opacity-50 font-medium transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!selectedTrack || submitPending}
          className={`flex-1 py-3 rounded-full font-medium transition-all ${
            selectedTrack
              ? "bg-spotify-green hover:bg-green-400 text-black"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          }`}
        >
          Submit
        </button>
      </div>
    </>
  );
}
