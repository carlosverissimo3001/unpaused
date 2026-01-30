"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyChallengeBannerProps {
  isTrusted: boolean;
}

function DailyChallengeBannerComponent({ isTrusted }: DailyChallengeBannerProps) {
  if (!isTrusted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 p-6 bg-gradient-to-r from-spotify-green/20 to-emerald-600/20 rounded-xl border border-spotify-green/30 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold">Daily Challenge</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            A new mystery song every day from your playlists
          </p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="spotify" asChild>
            <Link href="/daily">
              <Play className="w-4 h-4 mr-2" />
              Play Today
            </Link>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export const DailyChallengeBanner = memo(DailyChallengeBannerComponent);
