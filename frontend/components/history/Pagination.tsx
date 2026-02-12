'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Build the page items array: numbers and ellipsis markers.
 *
 *   [1] 2 3 ... 12        (near start)
 *   1 ... 5 [6] 7 ... 12  (middle)
 *   1 ... 10 11 [12]       (near end)
 */
function getPageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | '...')[] = [];
  items.push(1);

  if (current <= 3) {
    items.push(2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    items.push('...', total - 3, total - 2, total - 1, total);
  } else {
    items.push('...', current - 1, current, current + 1, '...', total);
  }

  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPageItems(currentPage, totalPages);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Pagination"
      className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-4"
    >
      {/* Fade-out gradient mask beneath the bar */}
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-transparent to-transparent pointer-events-none" />

      <div className="flex flex-col items-center gap-1.5">
        {/* "Page X of Y" — hidden on mobile, shown sm+ */}
        <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          Page {currentPage} of {totalPages}
        </span>

        {/* ── Desktop: full numbered bar (hidden below sm) ── */}
        <div className="hidden sm:inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4),_0_0_0_1px_rgba(255,255,255,0.03)]">
          <NavButton
            direction="prev"
            disabled={isFirst}
            onClick={() => onPageChange(currentPage - 1)}
          />

          {items.map((item, idx) =>
            item === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center w-9 h-9 text-white/20 text-xs select-none"
                aria-hidden
              >
                ...
              </span>
            ) : (
              <PageButton
                key={item}
                page={item}
                isActive={item === currentPage}
                onClick={() => onPageChange(item)}
              />
            ),
          )}

          <NavButton
            direction="next"
            disabled={isLast}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </div>

        {/* ── Mobile: compact bar (shown below sm) ── */}
        <div className="inline-flex sm:hidden items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4),_0_0_0_1px_rgba(255,255,255,0.03)]">
          <NavButton
            direction="prev"
            disabled={isFirst}
            onClick={() => onPageChange(currentPage - 1)}
            compact
          />

          <span className="px-3 text-[11px] font-semibold text-white/60 tabular-nums select-none">
            <span className="text-spotify-green font-bold">{currentPage}</span>
            <span className="text-white/25 mx-1">/</span>
            {totalPages}
          </span>

          <NavButton
            direction="next"
            disabled={isLast}
            onClick={() => onPageChange(currentPage + 1)}
            compact
          />
        </div>
      </div>
    </motion.nav>
  );
}

/* ── Sub-components ── */

function NavButton({
  direction,
  disabled,
  onClick,
  compact,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const size = compact ? 'w-7 h-7' : 'w-9 h-9';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
      className={`flex items-center justify-center ${size} rounded-xl transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed text-white/60 hover:text-white hover:bg-white/[0.08] active:scale-90`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function PageButton({
  page,
  isActive,
  onClick,
}: {
  page: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-90"
    >
      {isActive && (
        <motion.div
          layoutId="active-page"
          className="absolute inset-0 rounded-xl bg-spotify-green/20 border border-spotify-green/30 shadow-[0_0_12px_rgba(30,215,96,0.15)]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={`relative z-10 ${
          isActive
            ? 'text-spotify-green font-bold'
            : 'text-white/50 hover:text-white'
        }`}
      >
        {page}
      </span>
    </button>
  );
}
