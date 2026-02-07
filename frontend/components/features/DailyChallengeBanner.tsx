"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Play, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayedToday } from "@/hooks/game/usePlayedToday";
import { DailyChallengeCountdown } from "./DailyChallangeCountdown";

interface DailyChallengeBannerProps {
  isTrusted: boolean;
}

function DailyChallengeBannerComponent({ isTrusted }: DailyChallengeBannerProps) {
  const { data: playedTodayData, isLoading: playedTodayLoading } = usePlayedToday({
    enabled: isTrusted,
  });

  const playedToday = playedTodayData?.playedToday ?? false;
  const showAsPlayed = playedTodayLoading ? true : playedToday;

  if (!isTrusted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-6 shadow-2xl group transform-gpu"
    >
      <motion.div
        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[150px] -right-[100px] w-[300px] h-[300px] bg-spotify-green/15 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="relative z-10 flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 sm:gap-3 flex-1 min-w-0">
          <div className="hidden sm:inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-spotify-green/10 border border-spotify-green/20 text-spotify-green text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3 fill-current" />
            Daily Event
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <h2 className="text-lg sm:text-3xl font-black tracking-tighter text-white truncate">
              The Daily <span className="text-spotify-green">Mystery.</span>
            </h2>
            <p className="text-white/50 text-[11px] sm:text-base font-medium line-clamp-1 sm:line-clamp-none">
              One song, six chances. Guess in 1s.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={showAsPlayed ? "outline" : "spotify"}
              size="sm"
              asChild
              className={
                showAsPlayed
                  ? "h-10 sm:h-14 px-4 sm:px-8 !rounded-full text-xs sm:text-lg font-bold border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  : "h-10 sm:h-14 px-4 sm:px-8 !rounded-full text-xs sm:text-lg font-bold shadow-[0_0_20px_rgba(30,215,96,0.2)]"
              }
            >
              <Link
                href={showAsPlayed ? "/daily/stats" : "/daily"}
                className="flex items-center gap-2 sm:gap-3"
              >
                {showAsPlayed ? (
                  <>
                    <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5" />
                    <span>Stats</span>
                    <ArrowRight className="hidden sm:block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" className="w-3 h-3 sm:w-5 sm:h-5" />
                    <span>Play</span>
                    <ArrowRight className="hidden sm:block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Link>
            </Button>
          </motion.div>

          {showAsPlayed && !playedTodayLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mr-2"
            >
              <DailyChallengeCountdown />
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
}

export const DailyChallengeBanner = memo(DailyChallengeBannerComponent);