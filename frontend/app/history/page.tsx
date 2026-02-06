"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { useInfiniteGameHistory } from "@/hooks/game/useInfiniteGameHistory";
import { useGameShare } from "@/hooks/game/useGameShare";
import { GameHistoryEntryDtoStatusEnum } from "@/sdk/models/GameHistoryEntryDto";
import { HistoryStats } from "@/components/history/HistoryStats";
import { HistoryFilter } from "@/components/history/HistoryFilter";
import { HistoryCard } from "@/components/history/HistoryCard";
import { EmptyHistory } from "@/components/history/EmptyHistory";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/auth/useMe";
import { useGameStats } from "../../hooks/game/useGameStats";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

function HistoryPageContent() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteGameHistory();

  const shareMutation = useGameShare();
  const { data: user } = useMe();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [dailyOnly, setDailyOnly] = useState(searchParams.get("filter") === "daily");

  const { data: stats } = useGameStats( { mode: dailyOnly ? GameMode.Daily : GameMode.All, useCached: true } );

  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data?.pages]);

  const items = useMemo(() => {
    if (dailyOnly) {
      return allItems.filter((e) => e.isDaily);
    }
    return allItems;
  }, [allItems, dailyOnly]);

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
        toast.error("Failed to copy share text");
      }
    },
    [shareMutation]
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
            {error instanceof Error ? error.message : "Something went wrong"}
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

      <HistoryFilter dailyOnly={dailyOnly} isTrusted={user?.isTrusted ?? false} onDailyOnlyChange={setDailyOnly} />

      {/* TWO-COLUMN GRID FOR BROWSER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <aside className="lg:col-span-4 lg:sticky lg:top-8">
          {stats && <HistoryStats stats={stats} />}
          <div className="hidden lg:block mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/30 leading-relaxed uppercase tracking-widest font-bold">
              Your Vault
            </p>
            <p className="text-sm text-white/50 mt-2">
              Viewing {dailyOnly ? "Daily Challenges" : "all games"} across your entire history.
            </p>
          </div>
        </aside>

        {/* LIST SECTION */}
        <main className="lg:col-span-8">
          {items.length === 0 ? (
            <EmptyHistory dailyOnly={dailyOnly} />
          ) : (
            <motion.div
              className="space-y-3 sm:space-y-4" // Tighter gap on mobile
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.05 },
                },
              }}
            >
              {items.map((entry, index) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  onShare={handleShare}
                  copied={copiedId === entry.id}
                  showWinnerGlow={
                    entry.status === GameHistoryEntryDtoStatusEnum.Won &&
                    entry.score != null &&
                    (entry.score === 6 || entry.score === 5)
                  }
                  staggerIndex={index}
                />
              ))}
              
              {/* Load More... */}
            </motion.div>
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
