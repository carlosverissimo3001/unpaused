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

const FilterPill = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 ${
      active 
        ? "bg-spotify-green border-spotify-green text-black shadow-[0_0_15px_rgba(30,215,96,0.3)]" 
        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white"
    }`}
  >
    {label}
  </button>
);

function PlaylistFiltersComponent({
  includePrivate,
  onlyUserOwned,
  onIncludePrivateChange,
  onOnlyUserOwnedChange,
}: PlaylistFiltersProps) {
  return (
    <div className="flex gap-3 mt-4">
      <FilterPill 
        active={includePrivate} 
        onClick={() => onIncludePrivateChange(!includePrivate)}
        label="Private Playlists"
      />
      <FilterPill 
        active={onlyUserOwned} 
        onClick={() => onOnlyUserOwnedChange(!onlyUserOwned)}
        label="Owned by Me"
      />
    </div>
  );
}

export const PlaylistFilters = memo(PlaylistFiltersComponent);
