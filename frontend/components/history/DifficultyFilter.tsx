'use client';

import type { GauntletDifficultyFilter } from '@/hooks/speed-run/useSpeedRunHistory';

const OPTIONS: Array<{ value?: GauntletDifficultyFilter; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
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
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all ${
                active
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30'
                  : 'text-fg/40 hover:text-fg/70 hover:bg-fg/[0.05]'
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
