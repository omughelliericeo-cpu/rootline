// Calendar-date helpers. "Day" questions (has this certificate expired? how
// many days until it does?) are answered with YYYY-MM-DD keys in the brand's
// time zone, so the answer matches the producer's wall calendar.

/** "2026-10-24": the calendar date of `instant` in `timeZone`. */
export function dateKeyIn(instant: Date, timeZone: string): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

/**
 * The key of a date-only database column. Prisma returns @db.Date values as
 * midnight UTC, so the UTC date is the stored date.
 */
export function storedDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Whole days from key `from` to key `to` (negative when `to` is earlier). */
export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** A "YYYY-MM-DD" form value -> Date for a @db.Date column. */
export function dateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

/** "24 Oct 2026" for display. */
export function formatDateKey(key: string): string {
  return new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    dateFromKey(key),
  );
}

/** Minutes the zone is ahead of UTC at `instant` (e.g. -420 for Vancouver in summer). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000);
}

/**
 * The instant when the wall clock in `timeZone` shows `dateKey` at `time`
 * ("05:00"). Used for "baked at 5am" style dates entered by the producer.
 */
export function zonedDateTime(dateKey: string, time: string, timeZone: string): Date {
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  const wallClockAsUtc = Date.parse(`${dateKey}T00:00:00Z`) + (hours * 60 + minutes) * 60_000;
  // Two passes, so a date on the far side of a daylight-saving change still lands right.
  let guess = wallClockAsUtc - offsetMinutes(new Date(wallClockAsUtc), timeZone) * 60_000;
  guess = wallClockAsUtc - offsetMinutes(new Date(guess), timeZone) * 60_000;
  return new Date(guess);
}

/**
 * A date with no time of day is stored as midday in the brand's zone, so it
 * reads as the same calendar day everywhere in that zone.
 */
export function zonedDate(dateKey: string, timeZone: string): Date {
  return zonedDateTime(dateKey, "12:00", timeZone);
}

/** "05:30": the wall-clock time of `instant` in `timeZone`, for edit forms. */
export function timeIn(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant);
}
