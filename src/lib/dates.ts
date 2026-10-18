const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Whole calendar days between two timestamps (DST-safe).
function daysBetween(earlier: number, later: number): number {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / DAY_MS);
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });
}

// Section heading on the board: "Today", "Yesterday", "Tuesday", "Sep 12".
export function dayLabel(timestamp: number, now = Date.now()): string {
  const days = daysBetween(timestamp, now);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(timestamp).toLocaleDateString([], { weekday: 'long' });
  return formatDate(timestamp);
}

export function dayKey(timestamp: number): number {
  return startOfDay(timestamp);
}

// Consecutive days with at least one scan, counting back from today. A streak
// is still alive if the last scan was yesterday.
export function currentStreak(timestamps: number[], now = Date.now()): number {
  const days = new Set(timestamps.map(dayKey));
  let cursor = startOfDay(now);
  if (!days.has(cursor)) cursor = startOfDay(cursor - DAY_MS / 2);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = startOfDay(cursor - DAY_MS / 2);
  }
  return streak;
}

export function longestStreak(timestamps: number[]): number {
  const days = [...new Set(timestamps.map(dayKey))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

export type DayCount = { key: number; label: string; count: number; isToday: boolean };

// Scan counts for the last seven days, oldest first.
export function lastSevenDays(timestamps: number[], now = Date.now()): DayCount[] {
  const counts = new Map<number, number>();
  for (const timestamp of timestamps) {
    const key = dayKey(timestamp);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: DayCount[] = [];
  let cursor = startOfDay(now);
  for (let i = 0; i < 7; i++) {
    result.unshift({
      key: cursor,
      label: new Date(cursor).toLocaleDateString([], { weekday: 'narrow' }),
      count: counts.get(cursor) ?? 0,
      isToday: i === 0,
    });
    cursor = startOfDay(cursor - DAY_MS / 2);
  }
  return result;
}
