'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HistoryFilterProps {
  dailyOnly: boolean;
  isTrusted: boolean;
  onDailyOnlyChange: (value: boolean) => void;
}

export function HistoryFilter({
  dailyOnly,
  isTrusted,
  onDailyOnlyChange,
}: HistoryFilterProps) {
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
      {isTrusted && (
        <div className="ml-auto flex items-center gap-1.5 p-1 rounded-xl bg-fg/[0.03] border border-fg/10 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => onDailyOnlyChange(false)}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold uppercase tracking-widest transition-all ${
              !dailyOnly
                ? 'bg-fg/15 text-fg shadow-sm'
                : 'text-fg/50 hover:text-fg/80'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onDailyOnlyChange(true)}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold uppercase tracking-widest transition-all ${
              dailyOnly
                ? 'bg-spotify-green/30 text-spotify-green shadow-sm'
                : 'text-fg/50 hover:text-fg/80'
            }`}
          >
            Daily
          </button>
        </div>
      )}
    </div>
  );
}
