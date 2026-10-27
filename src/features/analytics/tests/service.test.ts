// Tests for reading a scan's rough location and source.
import { describe, expect, it } from "vitest";
import { coarseLocation, fillDays, percentChange, scanSource, weekTotals } from "../service";

describe("coarseLocation", () => {
  it("reads Vercel's geo headers", () => {
    const headers = new Headers({ "x-vercel-ip-country": "CA", "x-vercel-ip-country-region": "BC", "x-vercel-ip-city": "Port%20Moody" });
    expect(coarseLocation(headers)).toEqual({ country: "CA", region: "BC", city: "Port Moody" });
  });

  it("is empty when there are no geo headers (e.g. locally)", () => {
    expect(coarseLocation(new Headers())).toEqual({ country: null, region: null, city: null });
  });

  it("ignores malformed values", () => {
    expect(coarseLocation(new Headers({ "x-vercel-ip-city": "%E0%A4%A" })).city).toBeNull();
  });
});

describe("scanSource", () => {
  it("counts shelf-code visits separately", () => {
    expect(scanSource("shelf")).toBe("SHELF");
    expect(scanSource(undefined)).toBe("BATCH");
    expect(scanSource(["shelf"])).toBe("BATCH");
  });
});

describe("daily counts", () => {
  it("fills days without scans with zero, oldest first", () => {
    expect(fillDays([{ day: "2026-10-23", count: 4 }], "2026-10-24", 3)).toEqual([
      { day: "2026-10-22", count: 0 },
      { day: "2026-10-23", count: 4 },
      { day: "2026-10-24", count: 0 },
    ]);
  });

  it("crosses month ends", () => {
    expect(fillDays([], "2026-11-01", 2).map((day) => day.day)).toEqual(["2026-10-31", "2026-11-01"]);
  });

  it("splits 14 days into this week and last week", () => {
    const days = Array.from({ length: 14 }, (_, index) => ({ day: `d${index}`, count: index < 7 ? 1 : 2 }));
    expect(weekTotals(days)).toEqual({ thisWeek: 14, lastWeek: 7 });
  });

  it("describes the change against last week", () => {
    expect(percentChange(118, 100)).toBe("+18%");
    expect(percentChange(95, 100)).toBe("-5%");
    expect(percentChange(100, 100)).toBe("0%");
    expect(percentChange(12, 0)).toBeNull();
  });
});
