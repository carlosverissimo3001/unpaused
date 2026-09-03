'use client';

import type { GauntletDifficultyFilter } from '@/hooks/speed-run/useSpeedRunHistory';

interface Option {
  value?: GauntletDifficultyFilter;
  label: string;
  /** Cool to hot, so the row reads as a ramp rather than five of the same. */
  active: string;
}

const OPTIONS: Option[] = [
  { value: undefined, label: 'All', active: 'bg-fg/15 text-fg ring-fg/20' },
  {
    value: 'EASY',
    label: 'Easy',
    active: 'bg-spotify-green/20 text-spotify-green ring-spotify-green/30',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    active: 'bg-sky-400/20 text-sky-300 ring-sky-400/30',
  },
  {
    value: 'HARD',
    label: 'Hard',
    active: 'bg-amber-500/20 text-amber-400 ring-amber-400/30',
  },
  {
    value: 'EXPERT',
    label: 'Expert',
    active: 'bg-rose-500/20 text-rose-400 ring-rose-400/30',
  },
];

interface DifficultyFilterProps {
  selected?: GauntletDifficultyFilter;
  onChange: (difficulty?: GauntletDifficultyFilter) => void;
}

/** Speed run's own filter, in the panel where every other mode keeps its numbers. */
export function DifficultyFilter({
  selected,
  onChange,
}: DifficultyFilterProps) {
  return (
    <div className="border-t border-fg/[0.07] px-5 py-4">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-fg/30">
        Difficulty
      </p>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all ring-1 ${
                active
                  ? option.active
                  : 'bg-fg/[0.03] text-fg/50 ring-fg/10 hover:bg-fg/[0.06] hover:text-fg/80 hover:ring-fg/20'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
