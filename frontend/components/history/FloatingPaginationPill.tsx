'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/hooks/game/useGameHistory';

interface FloatingPaginationPillProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  isFetching?: boolean;
}

export function FloatingPaginationPill({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isFetching = false,
}: FloatingPaginationPillProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4"
    >
      {/* Cards used to run straight into the pill mid-scroll; they fade under it now. */}
      <div
        className="pointer-events-none absolute -inset-x-16 -bottom-6 -top-8 -z-10 bg-gradient-to-t from-bg via-bg/80 to-transparent"
        aria-hidden
      />
      <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 rounded-full bg-black/70 backdrop-blur-3xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.7),_0_0_0_1px_rgba(29,185,84,0.06)]">
        <motion.button
          whileTap={{ scale: 0.85 }}
          disabled={isFetching || currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center justify-center w-7 h-7 rounded-full text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </motion.button>

        <span className="text-[11px] font-semibold text-white/70 tabular-nums select-none min-w-[3rem] sm:min-w-[3.5rem] text-center">
          <span className="text-[#1DB954] font-bold">{currentPage}</span>
          <span className="text-white/20 mx-0.5">/</span>
          {Math.max(totalPages, 1)}
        </span>

        <motion.button
          whileTap={{ scale: 0.85 }}
          disabled={isFetching || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center justify-center w-7 h-7 rounded-full text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>

        {/* Page size selector - hidden on very small screens */}
        <div className="hidden xs:flex items-center">
          <div className="w-px h-4 bg-white/10 mx-0.5 sm:mx-1" />
          <div className="flex items-center gap-0.5">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size)}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums transition-all duration-150 touch-manipulation ${
                  pageSize === size
                    ? 'bg-white/15 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
