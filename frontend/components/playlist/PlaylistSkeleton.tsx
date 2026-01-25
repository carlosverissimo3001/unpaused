"use client";

export function PlaylistSkeleton() {
  return (
    <div className="group relative bg-white/5 backdrop-blur-md rounded-xl p-4 text-left border border-white/10 overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="flex gap-4 relative z-10">
        {/* Playlist image skeleton */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
        </div>

        {/* Playlist info skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
          <div className="h-3 bg-white/5 rounded w-1/3 mt-2" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2 mt-4 relative z-10">
        <div className="flex-1 h-9 bg-white/10 rounded-lg" />
        <div className="flex-1 h-9 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}
