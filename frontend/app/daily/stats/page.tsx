"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Trophy, Target, BarChart3 } from "lucide-react";
import { useGameStats } from "@/hooks/game/useGameStats";
import { usePlayedToday } from "@/hooks/game/usePlayedToday";
import { AnimatedCounter } from "@/components/daily/AnimatedCounter";
import { ScoreDistributionChart } from "@/components/daily/ScoreDistributionChart";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { GameStatsDtoModeEnum as GameMode } from "@/sdk";

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };
const STAGGER_DELAY = 0.12;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING,
  },
};

const RING_DURATION = 0.5;
const RING_DELAY = 0.25;

export default function DailyStatsPage() {
  const { data: stats, isLoading, error } = useGameStats({ mode: GameMode.Daily });
  const { data: playedTodayData } = usePlayedToday();
  const playedToday = playedTodayData?.playedToday ?? false;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#121212" }}
      >
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#121212" }}
      >
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link href="/" className="text-spotify-green hover:underline">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen overflow-hidden pb-24 relative" style={{ background: "#121212" }}>
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none"
        animate={{
          opacity: [0.5, 0.9, 0.5],
          background: [
            `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.06) 0%, transparent 45%)`,
            `radial-gradient(ellipse 130% 90% at 50% 0%, rgba(29, 185, 84, 0.16) 0%, transparent 50%),
             radial-gradient(ellipse 90% 130% at 80% 100%, rgba(29, 185, 84, 0.1) 0%, transparent 50%),
             radial-gradient(ellipse 90% 90% at 20% 80%, rgba(29, 185, 84, 0.08) 0%, transparent 45%)`,
            `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(29, 185, 84, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse 80% 120% at 80% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 80% 80% at 20% 80%, rgba(29, 185, 84, 0.06) 0%, transparent 45%)`,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="p-6 max-w-2xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="flex items-center gap-4 mb-6" variants={itemVariants}>
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-xl font-bold text-white">Daily Stats</h1>
        </motion.div>

        <motion.div
          className="relative mb-8 p-6 rounded-2xl border border-spotify-green/25 overflow-hidden"
          variants={itemVariants}
        >
          <motion.div
            className="absolute inset-0 -z-0 pointer-events-none"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              background: [
                "radial-gradient(ellipse 100% 80% at 30% 50%, rgba(29, 185, 84, 0.35) 0%, transparent 60%)",
                "radial-gradient(ellipse 100% 80% at 70% 50%, rgba(29, 185, 84, 0.35) 0%, transparent 60%)",
                "radial-gradient(ellipse 100% 80% at 30% 50%, rgba(29, 185, 84, 0.35) 0%, transparent 60%)",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-spotify-green mb-2">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">Current streak</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-semibold text-3xl text-white">
                {stats.currentStreak > 0 && <span aria-hidden>🔥</span>}
                <AnimatedCounter
                  value={stats.currentStreak}
                  duration={1.4}
                  className="tabular-nums"
                />
                <span className="text-lg text-white/70 font-normal">day streak</span>
              </span>
              {stats.bestStreak != null && stats.bestStreak > 0 && (
                <span className="text-white/50 text-sm">Best: {stats.bestStreak}</span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-2 gap-3 mb-6" variants={itemVariants}>
          <motion.div
            className="p-4 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-3 bg-white/5"
            whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
            transition={SPRING}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-400/80" />
            </div>
            <div className="min-w-0">
              <p className="text-white/50 text-xs">Best streak</p>
              <p className="text-xl font-bold tabular-nums text-white">{stats.bestStreak}</p>
            </div>
          </motion.div>
          <motion.div
            className="p-4 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-3 bg-white/5"
            whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
            transition={SPRING}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-spotify-green/80" />
            </div>
            <div className="min-w-0">
              <p className="text-white/50 text-xs">Win rate</p>
              <p className="text-xl font-bold tabular-nums text-white">
                {stats.totalGames > 0 ? `${Math.round(stats.winRate * 100)}%` : "—"}
              </p>
            </div>
          </motion.div>
          <motion.div
            className="p-4 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-3 col-span-2 bg-white/5"
            whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
            transition={SPRING}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-white/60" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/50 text-xs">Games played</p>
              <p className="text-xl font-bold tabular-nums text-white">{stats.totalGames}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs">Avg score</p>
              <p className="text-xl font-bold tabular-nums text-white">
                {stats.totalGames > 0 ? stats.averageScore.toFixed(1) : "—"}
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-8 bg-white/5"
          variants={itemVariants}
        >
          <ScoreDistributionChart distribution={stats.roundDistribution} />
        </motion.div>

        <motion.div className="mt-8 flex justify-center" variants={itemVariants}>
          <Link
            href="/daily"
            className="relative inline-flex items-center justify-center rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
            aria-disabled={playedToday}
          >
            <span
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              aria-hidden
            >
              {!playedToday && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-[#1DB954]/40"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: RING_DURATION,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0,
                    }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-[#1DB954]/40"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: RING_DURATION,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: RING_DELAY,
                    }}
                  />
                </>
              )}
              {!playedToday && (
                <motion.span
                  className="absolute inset-y-0 w-1/3 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  }}
                  animate={{ x: ["0%", "400%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 4,
                    ease: "easeInOut",
                  }}
                />
              )}
            </span>
            <motion.span
              className={`relative z-10 inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-colors ${
                playedToday
                  ? "bg-white/10 text-white/70 shadow-none"
                  : "bg-spotify-green text-black shadow-lg shadow-spotify-green/25"
              }`}
              whileHover={playedToday ? undefined : { scale: 1.03 }}
              whileTap={playedToday ? undefined : { scale: 0.98 }}
              transition={SPRING}
            >
              {playedToday ? "View today's daily" : "Play today's daily"}
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
