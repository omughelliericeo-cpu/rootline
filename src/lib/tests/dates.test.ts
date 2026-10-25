// Tests for calendar-date helpers used by expiry checks.
import { describe, expect, it } from "vitest";
import { dateFromKey, dateKeyIn, daysBetweenKeys, formatDateKey, storedDateKey, timeIn, zonedDate, zonedDateTime } from "../dates";

describe("dates", () => {
  it("gives the calendar date in a time zone", () => {
    const lateEvening = new Date("2026-10-25T06:30:00Z"); // 11:30pm Oct 24 in Vancouver
    expect(dateKeyIn(lateEvening, "America/Vancouver")).toBe("2026-10-24");
    expect(dateKeyIn(lateEvening, "UTC")).toBe("2026-10-25");
  });

  it("reads stored date-only values as their UTC date", () => {
    expect(storedDateKey(new Date("2027-06-30T00:00:00Z"))).toBe("2027-06-30");
    expect(storedDateKey(dateFromKey("2027-06-30"))).toBe("2027-06-30");
  });

  it("counts whole days between keys, across months and years", () => {
    expect(daysBetweenKeys("2026-10-24", "2026-11-05")).toBe(12);
    expect(daysBetweenKeys("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetweenKeys("2026-10-24", "2026-10-20")).toBe(-4);
  });

  it("formats for display", () => {
    expect(formatDateKey("2027-06-30")).toBe("Jun 30, 2027");
  });
});

describe("zoned dates", () => {
  it("turns a local wall-clock time into the right instant", () => {
    // 5:00am on 24 Oct 2026 in Vancouver (UTC-7) is 12:00 UTC.
    expect(zonedDateTime("2026-10-24", "05:00", "America/Vancouver").toISOString()).toBe("2026-10-24T12:00:00.000Z");
    // In January Vancouver is UTC-8.
    expect(zonedDateTime("2026-01-15", "05:00", "America/Vancouver").toISOString()).toBe("2026-01-15T13:00:00.000Z");
    expect(timeIn(new Date("2026-10-24T12:30:00Z"), "America/Vancouver")).toBe("05:30");
  });

  it("stores date-only values at local midday, which keeps the calendar day", () => {
    const stored = zonedDate("2026-10-15", "America/Vancouver");
    expect(dateKeyIn(stored, "America/Vancouver")).toBe("2026-10-15");
  });
});
