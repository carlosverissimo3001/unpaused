'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Play, ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayedToday } from '@/hooks/game/usePlayedToday';
import { DailyChallengeCountdown } from './DailyChallangeCountdown';

function DailyChallengeBannerComponent() {
  const { data: playedTodayData, isLoading: playedTodayLoading } =
    usePlayedToday();

  const playedToday = playedTodayData?.playedToday ?? false;
  const showAsPlayed = playedTodayLoading ? true : playedToday;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-fg/10 bg-surface p-4 sm:p-6 shadow-2xl group transform-gpu"
    >
      <motion.div
        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-[150px] -right-[100px] w-[300px] h-[300px] bg-spotify-green/15 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-col gap-1 sm:gap-3 flex-1 min-w-0">
          <div className="hidden sm:inline-flex items-center gap-2 px-2 py-1 rounded-full bg-fg/5 border border-fg/10 w-fit text-[10px] uppercase tracking-wider font-bold text-fg/70">
            <Sparkles className="w-3 h-3 fill-current" />
            Daily Event
          </div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <h2 className="text-lg sm:text-3xl font-black tracking-tighter text-fg truncate leading-tight">
              The Daily <span className="text-spotify-green">Mystery.</span>
            </h2>
            <p className="text-fg/50 text-[10px] sm:text-base font-medium truncate sm:line-clamp-none">
              One song, six chances. Guess in 1s.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 sm:gap-3 shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={showAsPlayed ? 'outline' : 'spotify'}
              size="sm"
              asChild
              className={
                showAsPlayed
                  ? 'h-8 sm:h-10 px-3 sm:px-5 !rounded-full text-[11px] sm:text-sm font-bold border-fg/20 bg-fg/5 hover:bg-fg/10 text-fg'
                  : 'h-8 sm:h-10 px-3 sm:px-5 !rounded-full text-[11px] sm:text-sm font-bold shadow-[0_0_20px_rgba(30,215,96,0.2)]'
              }
            >
              <Link
                href={showAsPlayed ? '/daily/stats' : '/daily'}
                className="flex items-center gap-2"
              >
                {showAsPlayed ? (
                  <>
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Stats</span>
                    <ArrowRight className="hidden sm:block w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    <Play
                      fill="currentColor"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                    <span>Play</span>
                    <ArrowRight className="hidden sm:block w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Link>
            </Button>
          </motion.div>

          {showAsPlayed && !playedTodayLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex justify-end"
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
