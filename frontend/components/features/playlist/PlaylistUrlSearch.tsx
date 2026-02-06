"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaylistUrlSearchProps {
  playlistUrl: string;
  urlError: string | null;
  isSearchFocused: boolean;
  onPlaylistUrlChange: (url: string) => void;
  onSearchFocus: (focused: boolean) => void;
  onLoad: () => void;
}

function PlaylistUrlSearchComponent({
  playlistUrl,
  urlError,
  onPlaylistUrlChange,
  onLoad,
}: PlaylistUrlSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 group w-full transform-gpu"
    >
      <div className="relative flex items-center p-1.5 bg-white/[0.03] backdrop-blur-xl rounded-full border border-white/10 focus-within:border-spotify-green/40 focus-within:bg-white/[0.06] transition-all duration-500 shadow-2xl">
        <div className="relative flex-1 flex items-center">
          <Search className="ml-3 w-5 h-5 text-white/20 group-focus-within:text-spotify-green transition-colors shrink-0" />
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => onPlaylistUrlChange(e.target.value)}
            placeholder="Paste Spotify playlist link..."
            className="w-full bg-transparent pl-3 pr-4 py-2 text-sm sm:text-lg font-medium outline-none placeholder:text-white/10 text-white min-w-0"
          />
        </div>

        <Button
          onClick={onLoad}
          disabled={!playlistUrl.trim()}
          className={`
    !h-8 sm:!h-10 
    px-4 sm:px-8 
    !rounded-full 
    bg-white !text-black 
    hover:bg-spotify-green transition-all duration-300 
    shadow-lg active:scale-95 disabled:opacity-30 
    shrink-0 border-none
  `}
        >
          <span className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest">
            <span className="sm:hidden">Load</span>
            <span className="hidden sm:inline">Load Playlist</span>
          </span>
        </Button>
      </div>

      <AnimatePresence>
        {urlError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-400 text-xs sm:text-sm font-medium mt-3 ml-5 flex items-center gap-2"
          >
            <div className="w-1 h-1 rounded-full bg-red-400" />
            {urlError}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const PlaylistUrlSearch = memo(PlaylistUrlSearchComponent);
