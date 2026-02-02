"use client";

import { motion } from "framer-motion";

export function PlaylistSkeleton() {
  return (
    <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5 flex flex-col gap-5">
      {/* Artwork Square */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5 animate-pulse" />

      <div className="flex flex-col gap-3">
        <div className="h-6 w-3/4 bg-white/10 rounded-md animate-pulse" />
        
        <div className="h-4 w-1/2 bg-white/5 rounded-md animate-pulse" />

        <div className="mt-2 flex items-center justify-between">
          <div className="h-3 w-16 bg-white/5 rounded-full animate-pulse" />
          <div className="h-3 w-12 bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}