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
  isSearchFocused,
  onPlaylistUrlChange,
  onSearchFocus,
  onLoad,
}: PlaylistUrlSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-8 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"
    >
      <label className="block text-sm font-medium mb-2">Load any playlist by URL</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => onPlaylistUrlChange(e.target.value)}
            onFocus={() => onSearchFocus(true)}
            onBlur={() => onSearchFocus(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onLoad();
            }}
            placeholder="Paste Spotify playlist URL or ID..."
            className={`w-full px-4 py-2.5 pl-10 pr-20 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none transition-all duration-300 ${
              isSearchFocused
                ? "focus:ring-2 focus:ring-spotify-green/50 focus:border-spotify-green/50 shadow-[0_0_15px_rgba(30,215,96,0.2)]"
                : ""
            }`}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <AnimatePresence>
            {!playlistUrl && (
              <motion.kbd
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white/40 bg-white/5 border border-white/10 rounded"
              >
                <span className="text-xs">⌘</span>K
              </motion.kbd>
            )}
          </AnimatePresence>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onLoad}
            disabled={!playlistUrl.trim()}
            className="px-4"
          >
            <Search className="w-4 h-4 mr-2" />
            Load
          </Button>
        </motion.div>
      </div>
      {urlError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-destructive mt-2"
        >
          {urlError}
        </motion.p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Works with any public playlist, e.g. open.spotify.com/playlist/...
      </p>
    </motion.div>
  );
}

export const PlaylistUrlSearch = memo(PlaylistUrlSearchComponent);
