'use client';

export function PlaylistSkeleton() {
  return (
    <div className="group relative bg-surface/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-fg/5 overflow-hidden w-full h-full transform-gpu">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-fg/[0.05] to-transparent z-20" />

      <div className="flex flex-col h-full relative z-10">
        <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-5 bg-fg/10 shadow-2xl">
          <div className="w-full h-full bg-gradient-to-br from-fg/5 to-transparent" />
        </div>

        <div className="flex flex-col flex-1 space-y-3">
          <div className="h-4 sm:h-6 bg-fg/10 rounded-full w-3/4" />

          <div className="h-3 sm:h-4 bg-fg/5 rounded-full w-1/2" />

          <div className="mt-auto pt-2 sm:pt-4 flex items-center justify-between">
            <div className="h-2 sm:h-3 bg-fg/[0.03] rounded-full w-20" />
            <div className="h-2 sm:h-3 bg-fg/[0.03] rounded-full w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
