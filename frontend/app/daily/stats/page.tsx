"use client";

import Link from "next/link";
import { ArrowLeft, Flame, Trophy, Target, BarChart3 } from "lucide-react";
import { useGameStats } from "@/hooks/game/useGameStats";
import { StreakBadge } from "@/components/daily/StreakBadge";
import { ScoreDistributionChart } from "@/components/daily/ScoreDistributionChart";

export default function DailyStatsPage() {
  const { data: stats, isLoading, error } = useGameStats();

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
          <Link href="/daily" className="text-spotify-green hover:underline">
            Back to Daily
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/daily"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <h1 className="text-xl font-bold">Daily Stats</h1>
      </div>

      {/* Hero streak */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-spotify-green/15 to-emerald-600/10 border border-spotify-green/20">
        <div className="flex items-center gap-2 text-spotify-green mb-2">
          <Flame className="w-5 h-5" />
          <span className="text-sm font-medium">Current streak</span>
        </div>
        <StreakBadge
          currentStreak={stats.currentStreak}
          bestStreak={stats.bestStreak}
          className="text-3xl"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-400/80" />
          </div>
          <div className="min-w-0">
            <p className="text-white/50 text-xs">Best streak</p>
            <p className="text-xl font-bold tabular-nums">{stats.bestStreak}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-spotify-green/80" />
          </div>
          <div className="min-w-0">
            <p className="text-white/50 text-xs">Win rate</p>
            <p className="text-xl font-bold tabular-nums">
              {stats.totalGames > 0 ? `${Math.round(stats.winRate * 100)}%` : "—"}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 col-span-2">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white/60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/50 text-xs">Games played</p>
            <p className="text-xl font-bold tabular-nums">{stats.totalGames}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs">Avg score</p>
            <p className="text-xl font-bold tabular-nums">
              {stats.totalGames > 0 ? stats.averageScore.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Score distribution */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8">
        <ScoreDistributionChart distribution={stats.scoreDistribution} />
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/daily"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-spotify-green text-black font-semibold hover:bg-green-400 transition-colors shadow-lg shadow-spotify-green/20"
        >
          Play today&apos;s daily
        </Link>
      </div>
    </div>
  );
}
