'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type HistoryTab = 'all' | 'daily' | 'gauntlet';

interface HistoryFilterProps {
  activeTab: HistoryTab;
  isTrusted: boolean;
  isAdmin: boolean;
  onTabChange: (tab: HistoryTab) => void;
}

const TABS: {
  value: HistoryTab;
  label: string;
  adminOnly?: boolean;
  trustedOnly?: boolean;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'daily', label: 'Daily', trustedOnly: true },
  { value: 'gauntlet', label: 'Speed Run', adminOnly: true },
];

export function HistoryFilter({
  activeTab,
  isTrusted,
  isAdmin,
  onTabChange,
}: HistoryFilterProps) {
  const visibleTabs = TABS.filter((tab) => {
    if (tab.adminOnly && !isAdmin) return false;
    if (tab.trustedOnly && !isTrusted) return false;
    return true;
  });

  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      <Button variant="ghost" size="default" asChild>
        <Link
          href="/"
          className="flex items-center gap-2 text-fg/60 hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </Button>
      <h1 className="font-black italic uppercase text-xl text-fg tracking-tight">
        Vault
      </h1>
      {visibleTabs.length > 1 && (
        <div className="ml-auto flex items-center gap-1.5 p-1 rounded-xl bg-fg/[0.03] border border-fg/10 backdrop-blur-sm">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const activeClasses =
              tab.value === 'gauntlet'
                ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                : tab.value === 'daily'
                  ? 'bg-spotify-green/30 text-spotify-green shadow-sm'
                  : 'bg-fg/15 text-fg shadow-sm';

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onTabChange(tab.value)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold uppercase tracking-widest transition-all ${
                  isActive ? activeClasses : 'text-fg/50 hover:text-fg/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
