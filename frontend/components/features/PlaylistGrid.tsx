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

function PlaylistGridComponent({
  playlists,
  isLoading,
  onPlaylistHover,
  onClearFilters,
}: PlaylistGridProps) {
  return (
    <div className="min-h-[400px] relative">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PlaylistSkeleton key={i} />
            ))}
          </motion.div>
        ) : playlists.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="text-center py-12 text-muted-foreground"
          >
            <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No playlists found</p>
            {onClearFilters && (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="playlists"
            layoutRoot
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              minHeight: "400px",
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
        )}
      </AnimatePresence>
    </div>
  );
}

export const PlaylistGrid = memo(PlaylistGridComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.playlists.length !== nextProps.playlists.length) return false;
  
  // Check if all playlists are the same
  const arePlaylistsEqual = prevProps.playlists.every(
    (prev, index) =>
      prev.id === nextProps.playlists[index]?.id &&
      prev.name === nextProps.playlists[index]?.name
  );
  
  return arePlaylistsEqual;
});
