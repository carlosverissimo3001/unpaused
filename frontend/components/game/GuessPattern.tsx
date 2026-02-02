"use client";

const RESULT_EMOJI: Record<string, string> = {
  CORRECT: "🟩",
  ARTIST: "🟨",
  ARTIST_AND_ALBUM: "🟨",
  ALBUM: "🟨",
  WRONG: "🟥",
  SKIP: "⬜",
};

interface GuessPatternProps {
  results: string[];
  className?: string;
}

export function GuessPattern({ results, className = "" }: GuessPatternProps) {
  return (
    <div className={`flex flex-wrap gap-0.5 ${className}`} aria-label="Guess pattern">
      {results.map((r, i) => (
        <span key={i} title={r}>
          {RESULT_EMOJI[r] ?? "⬜"}
        </span>
      ))}
    </div>
  );
}
