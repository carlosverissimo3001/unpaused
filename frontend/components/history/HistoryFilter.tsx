'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { visibleModes, type HistoryTab } from './modes';

export type { HistoryTab };

interface HistoryFilterProps {
  activeTab: HistoryTab;
  isTrusted: boolean;
  onTabChange: (tab: HistoryTab) => void;
}

export function HistoryFilter({
  activeTab,
  isTrusted,
  onTabChange,
}: HistoryFilterProps) {
  const modes = visibleModes(isTrusted);

  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      {/* Not the Button component: its variant sets its own radius, and which
          of the two rounded-* classes wins is down to stylesheet order. */}
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-fg/60 transition-colors hover:bg-fg/[0.07] hover:text-fg"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </Link>
      <h1 className="font-black italic uppercase text-xl text-fg tracking-tight">
        Vault
      </h1>
      {modes.length > 1 && (
        <div className="ml-auto flex items-center gap-1.5 p-1 rounded-xl bg-fg/[0.03] border border-fg/10 backdrop-blur-sm">
          {modes.map((mode) => (
            <button
              key={mode.tab}
              type="button"
              onClick={() => onTabChange(mode.tab)}
              aria-pressed={activeTab === mode.tab}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold uppercase tracking-widest transition-all ${
                activeTab === mode.tab
                  ? mode.accent.pill
                  : 'text-fg/50 hover:text-fg/80'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
