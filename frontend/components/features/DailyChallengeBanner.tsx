"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Play, ArrowRight } from "lucide-react"; // Swapped for Sparkles for 'Game' vibe
import { Button } from "@/components/ui/button";

interface DailyChallengeBannerProps {
  isTrusted: boolean;
}

function DailyChallengeBannerComponent({ isTrusted }: DailyChallengeBannerProps) {
  if (!isTrusted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-2xl group"
    >
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[150px] -right-[100px] w-[400px] h-[400px] bg-spotify-green/20 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spotify-green/10 border border-spotify-green/20 text-spotify-green text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3 fill-current" />
            Limited Daily Event
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter text-white">
              The Daily <span className="text-spotify-green">Mystery.</span>
            </h2>
            <p className="text-white/50 text-base max-w-md font-medium">
              One song, six chances. Can you guess it from just the first 1 second?
            </p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
          <Button
            variant="spotify"
            size="lg"
            asChild
            className="h-14 px-8 rounded-full text-lg font-bold shadow-[0_0_30px_rgba(30,215,96,0.3)] transition-all duration-300 hover:shadow-spotify-green/40"
          >
            <Link href="/daily" className="flex items-center gap-3">
              <Play fill="currentColor" className="w-5 h-5" />
              Start Guessing
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
}

export const DailyChallengeBanner = memo(DailyChallengeBannerComponent);
