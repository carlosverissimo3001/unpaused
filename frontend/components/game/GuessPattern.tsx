'use client';

const RESULT_COLORS: Record<string, string> = {
  CORRECT: 'bg-spotify-green',
  ARTIST: 'bg-yellow-500',
  ARTIST_AND_ALBUM: 'bg-yellow-500',
  ALBUM: 'bg-yellow-500',
  WRONG: 'bg-red-500',
  SKIP: 'bg-white/10',
};

interface GuessPatternProps {
  results: string[];
  className?: string;
}

export function GuessPattern({ results, className = '' }: GuessPatternProps) {
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label="Guess pattern"
    >
      {results.map((r, i) => (
        <div
          key={i}
          title={r}
          className={`
            /* Size: Tiny on mobile (w-3), slightly bigger on desktop (sm:w-3.5) */
            w-3 h-3 sm:w-3.5 sm:h-3.5 
            rounded-[2px] 
            ${RESULT_COLORS[r] ?? 'bg-white/20'}
          `}
        />
      ))}
    </div>
  );
}
