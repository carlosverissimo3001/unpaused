'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Trophy, Frown, Ban, Command } from 'lucide-react';
import { GameControllerGetHistoryStatusEnum as GameStatusFilter } from '@/sdk/apis/ApiApi';
import { DEBOUNCE_MS } from '@/consts/consts';

const STATUS_CHIPS = [
  {
    value: GameStatusFilter.Won,
    label: 'Victory',
    icon: Trophy,
    activeColor: 'text-[#1DB954]',
    activeBg: 'bg-[#1DB954]',
  },
  {
    value: GameStatusFilter.Lost,
    label: 'Defeat',
    icon: Frown,
    activeColor: 'text-red-500',
    activeBg: 'bg-red-500',
  },
  {
    value: GameStatusFilter.Abandoned,
    label: 'Forfeit',
    icon: Ban,
    activeColor: 'text-zinc-400',
    activeBg: 'bg-zinc-400',
  },
] as const;

type StatusFilterValue =
  (typeof GameStatusFilter)[keyof typeof GameStatusFilter];

interface SearchHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilterValue[];
  onStatusChange: (status: StatusFilterValue[]) => void;
  totalItems: number;
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function SearchHeader({
  search,
  onSearchChange,
  status,
  onStatusChange,
  totalItems,
  isFiltered,
  onClearFilters,
}: SearchHeaderProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [isFocused, setIsFocused] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes('Mac'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(value);
      }, DEBOUNCE_MS);
    },
    [onSearchChange],
  );

  const clearInput = () => {
    handleSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative mb-6 lg:mb-8 select-none">
      <div className="flex items-center justify-between mb-2 lg:mb-2 px-1">
        <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/20">
          Showing{' '}
          <span className="text-white/60 tabular-nums">{totalItems}</span>{' '}
          Sessions
        </div>
      </div>

      <div className="group relative">
        <div
          className={`absolute -inset-[1px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-white/20 shadow-2xl">
          <div className="pl-3 sm:pl-5 pr-2 sm:pr-4 py-3 sm:py-4">
            <Search
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${isFocused ? 'text-white' : 'text-white/20'}`}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="FILTER BY TRACK, ARTIST..."
            className="w-full bg-transparent py-3 sm:py-4 pr-3 text-xs sm:text-sm font-medium tracking-wide sm:tracking-wider uppercase text-white placeholder:text-white/10 outline-none"
          />

          <div className="flex items-center gap-2 mr-4">
            <AnimatePresence>
              {localSearch && (
                <motion.button
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  onClick={clearInput}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 text-white/40 hover:text-white/80 transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px] font-bold tracking-tighter uppercase">
                    Clear
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent rounded shadow-inner text-[9px] font-bold text-white/30 min-w-fit justify-center whitespace-nowrap">
              {isMac ? (
                <>
                  <Command className="w-2.5 h-2.5 opacity-50" />
                  <span className="mt-[1px]">K</span>
                </>
              ) : (
                <span className="mt-[1px] tracking-tight">CTRL K</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 lg:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
        {STATUS_CHIPS.map((chip) => {
          const isActive = status.includes(chip.value);
          const Icon = chip.icon;

          const handleClick = () => {
            if (isActive) {
              onStatusChange(status.filter((s) => s !== chip.value));
            } else {
              onStatusChange([...status, chip.value]);
            }
          };

          return (
            <button
              key={chip.value}
              onClick={handleClick}
              className="group relative flex items-center gap-2 sm:gap-3 pl-2.5 sm:pl-3 pr-3 sm:pr-4 py-2 bg-white/[0.02] border border-white/5 rounded-lg transition-all active:scale-95 hover:border-white/10 touch-manipulation"
            >
              {/* Active Indicator Strip */}
              <div
                className={`absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-full transition-all duration-300 ${isActive ? chip.activeBg : 'bg-transparent opacity-0'}`}
              />

              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isActive ? chip.activeColor : 'text-white/20 group-hover:text-white/40'}`}
              />

              <span
                className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wide sm:tracking-widest transition-colors ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}
              >
                {chip.label}
              </span>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}

        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="ml-auto group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-tighter text-red-500/60 hover:text-red-500 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
            <span className="hidden xs:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
