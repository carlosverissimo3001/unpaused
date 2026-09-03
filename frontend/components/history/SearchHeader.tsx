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
    activeClass: 'bg-spotify-green/15 text-spotify-green ring-spotify-green/30',
  },
  {
    value: GameStatusFilter.Lost,
    label: 'Defeat',
    icon: Frown,
    activeClass: 'bg-red-500/15 text-red-400 ring-red-500/30',
  },
  {
    value: GameStatusFilter.Abandoned,
    label: 'Forfeit',
    icon: Ban,
    activeClass: 'bg-fg/10 text-fg/80 ring-fg/20',
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
      {isFiltered && (
        <div className="mb-2 px-1 text-xs text-fg/40">
          <span className="tabular-nums text-fg/70">{totalItems}</span>{' '}
          {totalItems === 1 ? 'match' : 'matches'}
        </div>
      )}

      <div className="group relative">
        <div
          className={`absolute -inset-[1px] bg-gradient-to-r from-fg/10 via-fg/5 to-fg/10 rounded-xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className="relative flex items-center bg-bg border border-fg/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-fg/20 shadow-2xl">
          <div className="pl-3 sm:pl-5 pr-2 sm:pr-4 py-3 sm:py-4">
            <Search
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${isFocused ? 'text-fg' : 'text-fg/20'}`}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Filter by track or artist"
            className="w-full bg-transparent py-3 sm:py-4 pr-3 text-sm text-fg placeholder:text-fg/30 outline-none"
          />

          <div className="flex items-center gap-2 mr-4">
            <AnimatePresence>
              {localSearch && (
                <motion.button
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  onClick={clearInput}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-fg/5 text-fg/40 hover:text-fg/80 transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px] font-bold tracking-tighter uppercase">
                    Clear
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-fg/10 bg-gradient-to-b from-fg/[0.05] to-transparent rounded shadow-inner text-[9px] font-bold text-fg/30 min-w-fit justify-center whitespace-nowrap">
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
              aria-pressed={isActive}
              className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors touch-manipulation ${
                isActive
                  ? chip.activeClass
                  : 'bg-fg/[0.03] text-fg/50 ring-fg/10 hover:bg-fg/[0.06] hover:text-fg/80 hover:ring-fg/20'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {chip.label}
            </button>
          );
        })}

        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="ml-auto group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs font-semibold text-red-500/60 hover:text-red-500 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
            <span className="hidden xs:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
