'use client';

import { EmptyHistory } from '@/components/history/EmptyHistory';
import { FreezeHistoryCard } from '@/components/history/FreezeHistoryCard';
import { HistoryCard } from '@/components/history/HistoryCard';
import { StreakLostCard } from '@/components/history/StreakLostCard';
import { HistoryFilter } from '@/components/history/HistoryFilter';
import { HistoryStats } from '@/components/history/HistoryStats';
import { Pagination } from '@/components/history/Pagination';
import { useMe } from '@/hooks/auth/useMe';
import { useGameShare } from '@/hooks/game/useGameShare';
import { useGameHistory, PAGE_SIZE } from '@/hooks/game/useGameHistory';
import { usePlayedToday } from '@/hooks/game/usePlayedToday';
import { GameHistoryEntryDtoStatusEnum } from '@/sdk/models/GameHistoryEntryDto';
import type { GameHistoryEntryDto } from '@/sdk/models/GameHistoryEntryDto';
import type { StreakFreezeUsageDto } from '@/sdk/models/StreakFreezeUsageDto';
import { AnimatePresence, motion } from 'framer-motion';
import { differenceInCalendarDays, parseISO, format, addDays } from 'date-fns';
import { BarChart3, Play } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useGameStats } from '../../hooks/game/useGameStats';
import { GameStatsDtoModeEnum as GameMode } from '../../sdk';

type StreakLostEntry = { from: string; to: string; gapDays: number };

type TimelineEntry =
  | { type: 'game'; data: GameHistoryEntryDto }
  | { type: 'freeze'; data: StreakFreezeUsageDto }
  | { type: 'streak-lost'; data: StreakLostEntry };

function HistoryPageContent() {
  const shareMutation = useGameShare();
  const { data: user } = useMe();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [dailyOnly, setDailyOnly] = useState(
    searchParams.get('filter') === 'daily',
  );
  const [page, setPage] = useState(1);
  const mainRef = useRef<HTMLElement>(null);

  const mode = dailyOnly ? GameMode.Daily : GameMode.All;
  const { data: stats } = useGameStats({ mode, useCached: true });
  const { data: playedTodayData } = usePlayedToday({
    enabled: dailyOnly && !!user,
  });

  const { data, isLoading, isPlaceholderData, error } = useGameHistory({
    mode: dailyOnly ? GameMode.Daily : undefined,
    page,
    enabled: !!user,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Scroll the main column to the top so the sticky pagination stays in view
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFilterChange = useCallback((daily: boolean) => {
    setDailyOnly(daily);
    setPage(1); // reset to first page on filter change
  }, []);

  const timeline = useMemo(() => {
    const gameItems = data?.items ?? [];
    const freezeUsages = data?.streakFreezeUsages ?? [];

    // Merge game + freeze entries, sorted by date descending
    const entries: TimelineEntry[] = [
      ...gameItems.map((data) => ({ type: 'game' as const, data })),
      ...freezeUsages.map((data) => ({ type: 'freeze' as const, data })),
    ];
    const getSortDate = (e: TimelineEntry) =>
      e.type === 'game'
        ? e.data.date
        : e.type === 'freeze'
          ? e.data.coveredTo
          : e.data.to;
    entries.sort((a, b) => getSortDate(b).localeCompare(getSortDate(a)));

    // For daily mode, detect gaps not covered by freezes and insert "streak lost" markers
    if (!dailyOnly || entries.length < 2) return entries;

    const result: TimelineEntry[] = [entries[0]];
    for (let i = 1; i < entries.length; i++) {
      const newerDate = parseISO(getSortDate(entries[i - 1]));
      const olderDate = parseISO(getSortDate(entries[i]));
      const gap = differenceInCalendarDays(newerDate, olderDate);
      if (gap > 1) {
        const gapFrom = addDays(olderDate, 1);
        const gapTo = addDays(newerDate, -1);
        result.push({
          type: 'streak-lost',
          data: {
            from: format(gapFrom, 'yyyy-MM-dd'),
            to: format(gapTo, 'yyyy-MM-dd'),
            gapDays: gap - 1,
          },
        });
      }
      result.push(entries[i]);
    }
    return result;
  }, [data?.items, data?.streakFreezeUsages, dailyOnly]);

  const handleShare = useCallback(
    async (id: string) => {
      try {
        const result = await shareMutation.mutateAsync(id);
        if (result?.shareText) {
          await navigator.clipboard.writeText(result.shareText);
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        }
      } catch {
        toast.error('Failed to copy share text');
      }
    },
    [shareMutation],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <Link href="/" className="text-spotify-green hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto pb-12 relative">
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent"
        aria-hidden
      />

      <HistoryFilter
        dailyOnly={dailyOnly}
        isTrusted={user?.isTrusted ?? false}
        onDailyOnlyChange={handleFilterChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 lg:sticky lg:top-8">
          {stats && <HistoryStats stats={stats} />}
          <div className="hidden lg:block mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/30 leading-relaxed uppercase tracking-widest font-bold">
              Your Vault
            </p>
            <p className="text-sm text-white/50 mt-2">
              Viewing {dailyOnly ? 'Daily Challenges' : 'all games'} across your
              entire history.
            </p>
            {dailyOnly && playedTodayData && (
              <Link
                href={playedTodayData.playedToday ? '/daily/stats' : '/daily'}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] bg-spotify-green/10 border border-spotify-green/20 text-spotify-green hover:bg-spotify-green/15"
              >
                {playedTodayData.playedToday ? (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Detailed Stats
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play Today&apos;s Daily
                  </>
                )}
              </Link>
            )}
          </div>
        </aside>

        <main ref={mainRef} className="lg:col-span-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />

          {timeline.length === 0 && !isPlaceholderData ? (
            <EmptyHistory dailyOnly={dailyOnly} />
          ) : isPlaceholderData ? (
            /* Skeleton placeholders while the next page loads */
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden"
                >
                  <div className="flex">
                    <div className="w-1 shrink-0 bg-white/10" />
                    <div className="p-4 flex-1 flex gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white/[0.06] shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-2.5 w-20 rounded-full bg-white/[0.06]" />
                        <div className="h-3.5 w-3/4 rounded-full bg-white/[0.08]" />
                        <div className="h-3 w-1/2 rounded-full bg-white/[0.05]" />
                        <div className="flex gap-1.5 pt-1">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <div
                              key={j}
                              className="w-4 h-4 rounded-sm bg-white/[0.06]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                className="space-y-3 sm:space-y-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {timeline.map((entry, index) => {
                  if (entry.type === 'freeze') {
                    return (
                      <FreezeHistoryCard
                        key={`freeze-${entry.data.id}`}
                        usage={entry.data}
                        staggerIndex={index}
                      />
                    );
                  }
                  if (entry.type === 'streak-lost') {
                    return (
                      <StreakLostCard
                        key={`lost-${entry.data.from}`}
                        from={entry.data.from}
                        to={entry.data.to}
                        gapDays={entry.data.gapDays}
                        staggerIndex={index}
                      />
                    );
                  }
                  return (
                    <HistoryCard
                      key={entry.data.id}
                      entry={entry.data}
                      onShare={handleShare}
                      copied={copiedId === entry.data.id}
                      showWinnerGlow={
                        entry.data.status ===
                          GameHistoryEntryDtoStatusEnum.Won &&
                        entry.data.score != null &&
                        (entry.data.score === 6 || entry.data.score === 5)
                      }
                      staggerIndex={index}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}
