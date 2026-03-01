'use client';

import { memo } from 'react';
import { ChevronDown, ArrowDownAZ, ListOrdered, Undo2 } from 'lucide-react';
import { type Visibility } from '@/hooks/playlists/usePlaylistFilters';
import { PlaylistControllerGetMyPlaylistsSortByEnum as SortPlaylistsBy } from '@/sdk';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface PlaylistFiltersProps {
  visibility: Visibility;
  onVisibilityChange: (value: Visibility) => void;
  sortBy: SortPlaylistsBy;
  onSortByChange: (value: SortPlaylistsBy) => void;
}

const SORT_OPTIONS = [
  { value: SortPlaylistsBy.Default, label: 'Default', icon: Undo2 },
  { value: SortPlaylistsBy.Name, label: 'Name A-Z', icon: ArrowDownAZ },
  { value: SortPlaylistsBy.Tracks, label: 'Most Tracks', icon: ListOrdered },
] as const;

const PILL_BASE =
  'relative overflow-hidden min-w-[72px] sm:min-w-[88px] h-8 sm:h-9 px-4 sm:px-5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-500 active:scale-90 flex items-center justify-center';
const PILL_ACTIVE =
  'bg-spotify-green border-white/20 text-black shadow-[0_10px_20px_-10px_rgba(30,215,96,0.5)]';
const PILL_INACTIVE =
  'bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.08] hover:border-white/20';

const FilterPill = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_INACTIVE}`}
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
  visibility,
  onVisibilityChange,
  sortBy,
  onSortByChange,
}: PlaylistFiltersProps) {
  const toggleVisibility = (target: 'public' | 'private') => {
    onVisibilityChange(visibility === target ? 'all' : target);
  };

  const activeSort =
    SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];
  const isSortActive = sortBy !== SortPlaylistsBy.Default;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
      <FilterPill
        active={visibility === 'public'}
        onClick={() => toggleVisibility('public')}
        label="Public"
      />
      <FilterPill
        active={visibility === 'private'}
        onClick={() => toggleVisibility('private')}
        label="Private"
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className={`${PILL_BASE} ml-0.5 sm:ml-1 gap-1.5 outline-none ${isSortActive ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            {isSortActive && (
              <span className="absolute inset-1 rounded-full bg-spotify-green blur-md opacity-40 animate-pulse -z-10" />
            )}
            {isSortActive && (
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {isSortActive ? activeSort.label : 'Sort'}
              <ChevronDown className="size-3 opacity-60" />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-[160px] bg-[#1a1a2e]/80 backdrop-blur-md border border-white/10"
        >
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
            Sort by
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortByChange(v as SortPlaylistsBy)}
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="text-xs text-white/70 focus:bg-white/[0.08] focus:text-white data-[state=checked]:text-white cursor-pointer gap-2"
              >
                <option.icon className="size-3.5 opacity-50" />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const PlaylistFilters = memo(PlaylistFiltersComponent);
