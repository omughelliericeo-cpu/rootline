// Scan analytics rules. Pure functions, unit tested.
import { addDaysToKey } from "@/lib/dates";

export type CoarseLocation = { country: string | null; region: string | null; city: string | null };

/**
 * A rough location from the hosting provider's geo headers (Vercel sets
 * these from the visitor's IP). Locally there are none, so everything is
 * null. The IP address itself is never read or stored.
 */
export function coarseLocation(headers: Headers): CoarseLocation {
  const read = (name: string, max: number) => {
    const value = headers.get(name);
    if (!value) return null;
    try {
      return decodeURIComponent(value).slice(0, max);
    } catch {
      return null;
    }
  };
  return {
    country: read("x-vercel-ip-country", 2),
    region: read("x-vercel-ip-country-region", 10),
    city: read("x-vercel-ip-city", 80),
  };
}

/** How the shopper arrived: a batch's own QR code, or a reusable shelf code. */
export function scanSource(searchParamVia: unknown): "BATCH" | "SHELF" {
  return searchParamVia === "shelf" ? "SHELF" : "BATCH";
}

export type DayCount = { day: string; count: number };

/**
 * One entry per calendar day, oldest first, ending on `lastDay`, with 0 for
 * days that had no scans (the database only returns days that had some).
 */
export function fillDays(rows: DayCount[], lastDay: string, days: number): DayCount[] {
  const counts = new Map(rows.map((row) => [row.day, row.count]));
  const result: DayCount[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = addDaysToKey(lastDay, -offset);
    result.push({ day, count: counts.get(day) ?? 0 });
  }
  return result;
}

/** "+18%" / "-5%" / "0%", or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
}

/** Splits 14 daily counts into the last 7 days and the 7 before them. */
export function weekTotals(days: DayCount[]): { thisWeek: number; lastWeek: number } {
  const sum = (list: DayCount[]) => list.reduce((total, day) => total + day.count, 0);
  return { thisWeek: sum(days.slice(-7)), lastWeek: sum(days.slice(-14, -7)) };
}
