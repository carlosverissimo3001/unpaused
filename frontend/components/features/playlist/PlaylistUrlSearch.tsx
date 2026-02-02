"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react"; // Added Loader2 for better UX
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
      className="relative mb-6 group"
    >
      <div className="relative flex items-center gap-2 p-2 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 focus-within:border-spotify-green/40 focus-within:bg-white/[0.06] transition-all duration-500 shadow-2xl">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-white/20 group-focus-within:text-spotify-green transition-colors" />
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => onPlaylistUrlChange(e.target.value)}
            placeholder="Paste a Spotify link to challenge yourself..."
            className="w-full bg-transparent pl-12 pr-4 py-2 text-lg font-medium outline-none placeholder:text-white/10 text-white"
          />
        </div>

        <Button
          onClick={onLoad}
          disabled={!playlistUrl.trim()}
          className="h-10 px-6 rounded-xl bg-white !text-black hover:bg-spotify-green transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <span className="flex items-center gap-2 font-bold text-black">
             <Search className="w-4 h-4" />
             Load Playlist
          </span>
        </Button>
      </div>

      <AnimatePresence>
        {urlError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-400 text-sm font-medium mt-3 ml-4 flex items-center gap-2"
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