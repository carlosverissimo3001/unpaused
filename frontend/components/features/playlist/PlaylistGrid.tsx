"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { PlaylistSkeleton } from "@/components/playlist/PlaylistSkeleton";
import type { PlaylistDto } from "@/sdk";

interface PlaylistGridProps {
  playlists: PlaylistDto[];
  isLoading: boolean;
  onPlaylistHover?: (color: string | null) => void;
  onClearFilters?: () => void;
}

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function PlaylistGridComponent({
  playlists,
  isLoading,
  onPlaylistHover,
  onClearFilters,
}: PlaylistGridProps) {
  // Loading
  if (isLoading) {
    return (
      <motion.div
        key="loading-grid"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PlaylistSkeleton key={`skeleton-${i}`} />
        ))}
      </motion.div>
    );
  }

  // Empty
  if (playlists.length === 0) {
    return (
      <motion.div
        key="empty-state"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground"
      >
        <ListMusic className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">No playlists found</p>
        {onClearFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters} 
            className="mt-4 gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </motion.div>
    );
  }

  // Has Data
  return (
    <motion.div
      key="playlist-grid"
      layoutRoot
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        maxWidth: "1200px",
        margin: "0 auto" 
      }}
    >
      <AnimatePresence mode="popLayout">
        {playlists.map((playlist, index) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            index={index}
            onHover={onPlaylistHover}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export const PlaylistGrid = memo(PlaylistGridComponent);