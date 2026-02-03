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

const GLASS_STYLE = {
  background: "rgba(18, 18, 18, 0.5)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)" as const,
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(29,185,84,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
};

const DROPDOWN_ITEM_STAGGER = 0.03;

export function GuessInput({ search, onSubmit, onSkip, submitPending }: GuessInputProps) {
  const selectedTrack = search.selectedTrack;

  return (
    <div className="space-y-4">
      <div ref={search.searchRef} className="relative">
        {selectedTrack ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl text-black"
            style={{
              background: "#1DB954",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 0 20px rgba(29,185,84,0.3)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{selectedTrack.name}</p>
              <p className="text-sm text-black/70 truncate">{selectedTrack.artist}</p>
            </div>
            <motion.button
              type="button"
              onClick={search.handleClearSelection}
              className="p-2 hover:bg-black/10 rounded-full transition-colors"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.span
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[#535353]"
              whileHover={{ rotate: 10 }}
            >
              <Search className="w-5 h-5 pointer-events-none" />
            </motion.span>
            <input
              type="text"
              value={search.searchQuery}
              onChange={(e) => {
                search.setSearchQuery(e.target.value);
                search.setShowDropdown(true);
              }}
              onFocus={() => search.setShowDropdown(true)}
              placeholder="Search for a song..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-[#535353] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954]/50 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
            <AnimatePresence>
              {search.showDropdown && search.searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-20 w-full mt-2 max-h-80 overflow-y-auto rounded-xl shadow-2xl border border-white/10"
                  style={{
                    background: "rgba(24, 24, 24, 0.95)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  {search.filteredTracks.length > 0 ? (
                    search.filteredTracks.map((track, index) => (
                      <motion.button
                        key={track.id}
                        type="button"
                        onClick={() => search.handleSelectTrack(track)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * DROPDOWN_ITEM_STAGGER, duration: 0.2 }}
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/10 border-b border-white/5 last:border-b-0 transition-colors first:rounded-t-xl last:rounded-b-xl"
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
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <motion.span whileHover={{ rotate: 15 }}>
                              <Disc3 className="w-5 h-5 text-[#535353]" />
                            </motion.span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">{track.name}</p>
                          <p className="text-sm text-[#b3b3b3] truncate">{track.artist}</p>
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="p-4 text-[#b3b3b3] text-center text-sm">
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

      <motion.div layout className="rounded-xl p-1 flex gap-3" style={GLASS_STYLE}>
        <motion.button
          type="button"
          onClick={onSkip}
          disabled={submitPending}
          whileHover={{ scale: submitPending ? 1 : 1.02 }}
          whileTap={{ scale: submitPending ? 1 : 0.98 }}
          className="flex-1 py-3.5 rounded-xl font-semibold text-white/90 border border-white/10 hover:border-white/20 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Skip
        </motion.button>
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!selectedTrack || submitPending}
          whileHover={selectedTrack && !submitPending ? { scale: 1.02 } : {}}
          whileTap={selectedTrack && !submitPending ? { scale: 0.98 } : {}}
          className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
            selectedTrack && !submitPending
              ? "bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1DB954]/20"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          }`}
        >
          Submit
        </motion.button>
      </motion.div>
    </div>
  );
}
