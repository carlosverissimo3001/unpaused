'use client';

const RESULT_HEIGHT: Record<string, string> = {
  CORRECT: 'h-full',
  ARTIST: 'h-3/4',
  ARTIST_AND_ALBUM: 'h-3/4',
  ALBUM: 'h-1/2',
  WRONG: 'h-1/3',
  SKIP: 'h-1/5',
};

const RESULT_COLOR: Record<string, string> = {
  CORRECT: 'bg-spotify-green shadow-[0_0_6px_rgba(29,185,84,0.5)]',
  ARTIST: 'bg-yellow-500',
  ARTIST_AND_ALBUM: 'bg-yellow-400',
  ALBUM: 'bg-amber-600',
  WRONG: 'bg-red-500',
  SKIP: 'bg-white/20',
};

interface GuessWaveProps {
  results: string[];
}

export function GuessWave({ results }: GuessWaveProps) {
  const padded = [...results];
  while (padded.length < 6) padded.push('EMPTY');

  return (
    <div className="flex items-end gap-[3px] h-5" aria-label="Guess wave">
      {padded.map((r, i) => (
        <div
          key={i}
          className={`w-[5px] rounded-full transition-all duration-300 ${
            r === 'EMPTY'
              ? 'h-[3px] bg-white/[0.06]'
              : `${RESULT_HEIGHT[r] ?? 'h-1/5'} ${RESULT_COLOR[r] ?? 'bg-white/20'}`
          }`}
        />
      ))}
    </div>
  );
}
