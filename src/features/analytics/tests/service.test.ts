// Tests for reading a scan's rough location and source.
import { describe, expect, it } from "vitest";
import { coarseLocation, scanSource } from "../service";

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
