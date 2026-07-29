// Helpers to split a calendar month into Sunday -> Saturday week buckets.
// A month can produce 4, 5, or occasionally 6 buckets depending on where
// the 1st and last day of the month fall.

export interface WeekBucket {
  index: number; // 1-based: "Minggu 1", "Minggu 2", ...
  start: Date; // Sunday (UTC midnight)
  end: Date; // Saturday (UTC midnight)
}

function toUTCDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}

/** month is 1-12 */
export function getWeekBucketsForMonth(year: number, month: number): WeekBucket[] {
  const firstDay = toUTCDate(year, month - 1, 1);
  const lastDay = toUTCDate(year, month, 0); // day 0 of next month = last day of this month

  const start = new Date(firstDay);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // rewind to Sunday

  const buckets: WeekBucket[] = [];
  const cursor = new Date(start);
  let idx = 1;

  while (cursor <= lastDay) {
    const bStart = new Date(cursor);
    const bEnd = new Date(cursor);
    bEnd.setUTCDate(bEnd.getUTCDate() + 6);
    buckets.push({ index: idx, start: bStart, end: bEnd });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
    idx++;
  }

  return buckets;
}

export function formatDateShort(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatDateRange(start: Date, end: Date) {
  return `${formatDateShort(start)} - ${formatDateShort(end)}`;
}

/** Parses a 'YYYY-MM-DD' SQL date string as a UTC date (avoids TZ drift). */
export function parseSQLDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function bucketIndexForDate(date: Date, buckets: WeekBucket[]): number | null {
  for (const b of buckets) {
    if (date >= b.start && date <= b.end) return b.index;
  }
  return null;
}

export const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Returns { year, month } for "current month", "next month" navigation. */
export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
