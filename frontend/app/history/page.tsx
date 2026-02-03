"use client";

import { useState, useMemo, useCallback } from "react";
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

export default function HistoryPage() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteGameHistory();
  const shareMutation = useGameShare();
  const { data: user } = useMe();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dailyOnly, setDailyOnly] = useState(false);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green" />
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
    <div className="min-h-screen p-6 max-w-2xl mx-auto pb-12 relative">
      {/* Pro-stats background glow */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-spotify-green/10 via-transparent to-transparent"
        aria-hidden
      />

      <HistoryStats items={items} />
      <HistoryFilter dailyOnly={dailyOnly} isTrusted={user?.isTrusted ?? false} onDailyOnlyChange={setDailyOnly} />

      {items.length === 0 ? (
        <EmptyHistory dailyOnly={dailyOnly} />
      ) : (
        <motion.div
          className="space-y-4"
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

          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-6">
              {isFetchingNextPage ? (
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              ) : (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => fetchNextPage()}
                  className="text-sm text-white/50 hover:text-white"
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
