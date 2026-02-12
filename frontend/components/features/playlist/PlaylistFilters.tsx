"use client";

import { memo } from "react";

interface PlaylistFiltersProps {
  onlyPublic: boolean;
  onlyUserOwned: boolean;
  onOnlyPublicChange: (value: boolean) => void;
  onOnlyUserOwnedChange: (value: boolean) => void;
  onClearFilters: () => void;
}

const FilterPill = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`
      relative overflow-hidden
      px-4 py-1.5 sm:px-5 sm:py-2 
      rounded-full border text-[10px] sm:text-xs font-black
      uppercase tracking-wider transition-all duration-500
      active:scale-90
      ${
        active 
          ? "bg-spotify-green border-white/20 text-black shadow-[0_10px_20px_-10px_rgba(30,215,96,0.5)] scale-105" 
          : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.08] hover:border-white/20"
      }
    `}
  >
    {active && (
      <span className="absolute inset-1 rounded-full bg-spotify-green blur-md opacity-40 animate-pulse -z-10" />
    )}
    {active && (
      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
    )}
    <span className="relative z-10">{label}</span>
  </button>
);

function PlaylistFiltersComponent({
  onlyPublic,
  onlyUserOwned,
  onOnlyPublicChange,
  onOnlyUserOwnedChange,
}: PlaylistFiltersProps) {
  return (

    <div className="flex gap-1.5 sm:gap-3">
      <FilterPill 
        active={onlyPublic} 
        onClick={() => onOnlyPublicChange(!onlyPublic)}
        label="Public"
      />
      <FilterPill 
        active={onlyUserOwned} 
        onClick={() => onOnlyUserOwnedChange(!onlyUserOwned)}
        label="Owned"
      />
    </div>
  );
}

export const PlaylistFilters = memo(PlaylistFiltersComponent);