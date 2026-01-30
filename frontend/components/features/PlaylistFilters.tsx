"use client";

import { memo } from "react";
import { motion } from "framer-motion";

interface PlaylistFiltersProps {
  includePrivate: boolean;
  onlyUserOwned: boolean;
  onIncludePrivateChange: (value: boolean) => void;
  onOnlyUserOwnedChange: (value: boolean) => void;
  onClearFilters: () => void;
}

function PlaylistFiltersComponent({
  includePrivate,
  onlyUserOwned,
  onIncludePrivateChange,
  onOnlyUserOwnedChange,
  onClearFilters,
}: PlaylistFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap gap-6 mt-4 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10"
    >
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={includePrivate}
          onChange={(e) => onIncludePrivateChange(e.target.checked)}
          className="w-4 h-4 rounded border-white/30 bg-white/5 text-spotify-green focus:ring-spotify-green focus:ring-offset-0 focus:ring-offset-transparent focus:ring-2 cursor-pointer transition-colors"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Include private playlists
        </span>
      </label>
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={onlyUserOwned}
          onChange={(e) => onOnlyUserOwnedChange(e.target.checked)}
          className="w-4 h-4 rounded border-white/30 bg-white/5 text-spotify-green focus:ring-spotify-green focus:ring-offset-0 focus:ring-offset-transparent focus:ring-2 cursor-pointer transition-colors"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Include only those I own
        </span>
      </label>
    </motion.div>
  );
}

export const PlaylistFilters = memo(PlaylistFiltersComponent);
