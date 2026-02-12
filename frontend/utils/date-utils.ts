import { format, parseISO, isSameDay } from "date-fns";

/**
 * Format a YYYY-MM-DD date string to a display string (e.g., "Feb 10, 2026")
 */
export function formatDate(dateStr: string, pattern = "MMM d, yyyy"): string {
  return format(new Date(dateStr), pattern);
}

/**
 * Format a date range for display.
 * Single day  → "Feb 10, 2026"
 * Same month  → "Feb 10–12, 2026"
 * Cross-month → "Jan 30 – Feb 2, 2026"
 */
export function formatDateRange(from: string, to: string): string {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  if (isSameDay(fromDate, toDate)) {
    return format(fromDate, "MMM d, yyyy");
  }
  if (
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getFullYear() === toDate.getFullYear()
  ) {
    return `${format(fromDate, "MMM d")}–${format(toDate, "d, yyyy")}`;
  }
  return `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d, yyyy")}`;
}
