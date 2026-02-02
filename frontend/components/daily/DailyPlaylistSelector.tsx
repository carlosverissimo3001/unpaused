"use client";

import Image from "next/image";
import { Check, Music2 } from "lucide-react";
import type { PlaylistDto } from "@/sdk";

interface DailyPlaylistSelectorProps {
  playlists: PlaylistDto[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

export function DailyPlaylistSelector({
  playlists,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  saving,
  saved,
  onSave,
}: DailyPlaylistSelectorProps) {
  const allSelected = playlists.length > 0 && selectedIds.length === playlists.length;
  const noneSelected = selectedIds.length === 0;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Music2 className="w-5 h-5 text-spotify-green" />
          Daily playlists
        </h3>
        <p className="text-white/60 text-sm mt-1.5">
          Pick playlists to draw your daily song from. Select none to use your first playlists by
          default.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs px-2.5 py-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-xs px-2.5 py-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            Clear
          </button>
          {!noneSelected && (
            <span className="text-xs text-white/50 self-center">{selectedIds.length} selected</span>
          )}
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {playlists.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggle(p.id)}
                className={`relative rounded-xl overflow-hidden text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-spotify-green/50 focus:ring-offset-2 focus:ring-offset-[#121212] ${
                  isSelected
                    ? "ring-2 ring-spotify-green shadow-[0_0_0_1px_rgba(30,215,96,0.4)]"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="aspect-square relative bg-white/10">
                  {p.imageUrl?.trim() ? (
                    <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="120px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-spotify-green/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </div>
                <p className="px-2 py-1.5 text-xs font-medium text-white truncate bg-black/40 absolute bottom-0 left-0 right-0">
                  {p.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-spotify-green text-black font-semibold hover:bg-green-400 disabled:opacity-50 transition-colors text-sm"
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save playlists"}
        </button>
      </div>
    </div>
  );
}
