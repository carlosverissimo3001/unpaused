/**
 * Format duration in milliseconds to a human-readable string (e.g., "2 hr 30 min" or "45 min")
 * @param ms - The duration in milliseconds
 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

/**
 * Format track duration in milliseconds to MM:SS format (e.g., "3:45")
 * @param ms - The duration in milliseconds
 */
export function formatTrackDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
