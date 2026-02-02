"use client";

import { getGuessResultStyle } from "./guess-result-styles";
import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";

interface Guess {
  trackId?: string | null;
  trackName?: string | null;
  artistName?: string | null;
  result: string;
}

interface GuessHistoryListProps {
  guesses: Guess[];
  title?: string;
}

export function GuessHistoryList({
  guesses,
  title = "Previous guesses",
}: GuessHistoryListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {guesses.map((guess, i) => {
          const style = getGuessResultStyle(guess.result);
          const isSkip = guess.result === GuessHistoryDtoResultEnum.Skip;
          return (
            <div
              key={i}
              className={`p-3 rounded-lg border ${style.cardClass}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium min-w-0">
                  {isSkip ? "Skipped" : guess.trackName ?? "—"}
                </p>
                {!isSkip && (
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${style.badgeClass}`}
                  >
                    {style.label}
                  </span>
                )}
              </div>
              {!isSkip && guess.artistName && (
                <p className="text-sm text-white/60 mt-0.5">{guess.artistName}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
