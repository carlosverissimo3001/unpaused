"use client";

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak?: number;
  className?: string;
}

export function StreakBadge({ currentStreak, bestStreak, className = "" }: StreakBadgeProps) {
  const isLarge = className.includes("text-3xl");
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`flex items-center gap-1.5 font-semibold ${isLarge ? "text-3xl" : ""}`}>
        {currentStreak > 0 && (
          <span aria-hidden className={isLarge ? "text-3xl" : ""}>
            🔥
          </span>
        )}
        <span>{currentStreak}</span>
        <span className={`text-white/60 font-normal ${isLarge ? "text-lg" : "text-sm"}`}>
          day streak
        </span>
      </span>
      {bestStreak != null && bestStreak > 0 && (
        <span className="text-white/50 text-sm">Best: {bestStreak}</span>
      )}
    </div>
  );
}
