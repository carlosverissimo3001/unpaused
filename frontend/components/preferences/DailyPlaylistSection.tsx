'use client';

import Image from 'next/image';
import { Search, Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMyPlaylists } from '@/hooks/playlists/useMyPlaylists';
import type { PlaylistDto } from '@/sdk';

// ─── Playlist row ────────────────────────────────────────────────────────────

interface PlaylistRowProps {
  imageUrl?: string;
  name: string;
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}

function PlaylistRow({
  imageUrl,
  name,
  checked,
  disabled,
  onClick,
}: PlaylistRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      className={`w-full flex items-center gap-3 px-3 py-2 transition-colors duration-100 text-left group focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-[#1DB954] ${
        checked ? 'bg-[#1DB954]/10' : 'hover:bg-fg/5'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="w-8 h-8 rounded-md overflow-hidden shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-fg/10" />
        )}
      </div>

      <span
        className={`flex-1 text-sm truncate transition-colors ${
          checked
            ? 'text-fg font-semibold'
            : 'text-fg/60 group-hover:text-fg/80'
        }`}
      >
        {name}
      </span>

      <div
        className={`w-4 h-4 rounded shrink-0 border transition-all duration-150 flex items-center justify-center ${
          checked
            ? 'bg-[#1DB954] border-[#1DB954]'
            : 'border-fg/20 group-hover:border-fg/40'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
            <path
              d="M1 4l2.5 2.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Overlapping covers preview ───────────────────────────────────────────────

interface SelectedPreviewProps {
  selected: string[];
  playlists: PlaylistDto[];
}

function SelectedPreview({ selected, playlists }: SelectedPreviewProps) {
  const MAX_SHOWN = 5;
  const overflow =
    selected.length > MAX_SHOWN ? selected.length - MAX_SHOWN : 0;
  const shown = selected.slice(0, MAX_SHOWN);

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center">
        {shown.map((id, i) => {
          const playlist = playlists.find((p) => p.id === id);
          return (
            <div
              key={id}
              className="w-6 h-6 rounded-full overflow-hidden border-2 border-bg shrink-0"
              style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}
            >
              {playlist?.imageUrl ? (
                <Image
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-fg/20" />
              )}
            </div>
          );
        })}
        {overflow > 0 && (
          <div
            className="w-6 h-6 rounded-full bg-fg/15 border-2 border-bg flex items-center justify-center shrink-0"
            style={{ marginLeft: -6 }}
          >
            <span className="text-[9px] font-bold text-fg/60">+{overflow}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-fg/40">
        {selected.length === 1 ? '1 playlist' : `${selected.length} playlists`}{' '}
        <span className="text-fg/25">· random each day</span>
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DailyPlaylistSectionProps {
  selected: string[];
  onToggle: (playlistId: string) => void;
  onReconcile?: (validIds: string[]) => void;
}

export function DailyPlaylistSection({
  selected,
  onToggle,
  onReconcile,
}: DailyPlaylistSectionProps) {
  const { data, isLoading } = useMyPlaylists({ limit: 50 });
  const [search, setSearch] = useState('');

  const playlists = data?.items ?? [];

  // When all playlists are loaded, strip any saved IDs that no longer exist.
  useEffect(() => {
    if (isLoading || !data || !onReconcile) return;
    const allLoaded = playlists.length >= data.total;
    if (!allLoaded) return;
    const knownIds = new Set(playlists.map((p) => p.id));
    const validIds = selected.filter((id) => knownIds.has(id));
    if (validIds.length !== selected.length) {
      onReconcile(validIds);
    }
  }, [isLoading]);
  const query = search.toLowerCase();
  const filteredPlaylists = query
    ? playlists.filter((p) => p.name.toLowerCase().includes(query))
    : playlists;

  const validSelected = selected;
  const isOnlyOne = validSelected.length === 1;

  return (
    <div className="py-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Shuffle className="w-3 h-3 text-[#1DB954]" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1DB954]/70">
          Daily Challenge
        </p>
      </div>
      <p className="text-xs text-fg/40 mb-3">
        Pick which playlists your daily songs are sourced from.
      </p>

      {/* Selected preview — only shown once user has made a valid selection */}
      {!isLoading && validSelected.length > 0 && (
        <SelectedPreview selected={validSelected} playlists={playlists} />
      )}

      <div className="rounded-xl border border-[#1DB954]/20 overflow-hidden bg-[#1DB954]/[0.03]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1DB954]/10">
          <Search className="w-3.5 h-3.5 text-fg/30 shrink-0" />
          <input
            type="text"
            aria-label="Search playlists"
            placeholder="Search playlists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-fg placeholder:text-fg/30 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="text-fg/30 hover:text-fg/60 transition-colors text-xs leading-none"
            >
              x
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[196px] divide-y divide-fg/5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-md bg-fg/10 animate-pulse shrink-0" />
                <div className="flex-1 h-3 rounded bg-fg/10 animate-pulse" />
                <div className="w-4 h-4 rounded border border-fg/10 animate-pulse shrink-0" />
              </div>
            ))
          ) : (
            <>
              {filteredPlaylists.map((playlist) => (
                <PlaylistRow
                  key={playlist.id}
                  imageUrl={playlist.imageUrl ?? undefined}
                  name={playlist.name}
                  checked={validSelected.includes(playlist.id)}
                  disabled={isOnlyOne && validSelected.includes(playlist.id)}
                  onClick={() => onToggle(playlist.id)}
                />
              ))}
              {filteredPlaylists.length === 0 && (
                <p className="text-xs text-fg/30 text-center py-6">
                  No playlists found
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {isOnlyOne && (
        <p className="text-[10px] text-fg/40 mt-1.5 text-center">
          At least one playlist must be selected
        </p>
      )}
    </div>
  );
}
