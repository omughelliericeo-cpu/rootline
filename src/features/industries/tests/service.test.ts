// Tests for the freshness line and template-driven field validation.
import { describe, expect, it } from "vitest";
import { getTemplate } from "../registry";
import { calendarDaysBetween, extraFieldsSchema, freshnessLabel, optionLabel } from "../service";

const VANCOUVER = "America/Vancouver";
// 2026-10-24 10:00 in Vancouver (UTC-7 in October).
const NOW = new Date("2026-10-24T17:00:00Z");

describe("freshnessLabel", () => {
  const brewery = getTemplate("brewery").freshness;
  const bakery = getTemplate("bakery").freshness;
  const winery = getTemplate("winery").freshness;

  it("counts days since canning for beer", () => {
    const packagedAt = new Date("2026-10-15T20:00:00Z"); // Oct 15, 1pm local
    expect(freshnessLabel(brewery, { madeAt: new Date("2026-10-01"), packagedAt }, NOW, VANCOUVER)).toBe(
      "Canned 9 days ago",
    );
  });

  it("says today and yesterday instead of 0 and 1 days", () => {
    const today = new Date("2026-10-24T15:00:00Z");
    const yesterday = new Date("2026-10-23T15:00:00Z");
    expect(freshnessLabel(brewery, { madeAt: today, packagedAt: today }, NOW, VANCOUVER)).toBe("Canned today");
    expect(freshnessLabel(brewery, { madeAt: today, packagedAt: yesterday }, NOW, VANCOUVER)).toBe("Canned yesterday");
  });

  it("counts days in the brand's time zone, not UTC", () => {
    // 11:30pm Oct 23 in Vancouver is already Oct 24 in UTC; it is still "yesterday" locally.
    const lateLastNight = new Date("2026-10-24T06:30:00Z");
    expect(calendarDaysBetween(lateLastNight, NOW, VANCOUVER)).toBe(1);
  });

  it("switches to the month after 60 days", () => {
    const packagedAt = new Date("2026-06-10T18:00:00Z");
    expect(freshnessLabel(brewery, { madeAt: packagedAt, packagedAt }, NOW, VANCOUVER)).toBe("Canned in June 2026");
  });

  it("treats a future date as today", () => {
    const tomorrow = new Date("2026-10-25T18:00:00Z");
    expect(freshnessLabel(brewery, { madeAt: tomorrow, packagedAt: tomorrow }, NOW, VANCOUVER)).toBe("Canned today");
  });

  it("returns null when the date it needs is missing", () => {
    expect(freshnessLabel(brewery, { madeAt: NOW, packagedAt: null }, NOW, VANCOUVER)).toBeNull();
  });

  it("gives bakeries the time of baking today", () => {
    const fiveAm = new Date("2026-10-24T12:00:00Z"); // 5:00am local
    const fiveThirty = new Date("2026-10-24T12:30:00Z");
    expect(freshnessLabel(bakery, { madeAt: fiveAm }, NOW, VANCOUVER)).toBe("Baked at 5am today");
    expect(freshnessLabel(bakery, { madeAt: fiveThirty }, NOW, VANCOUVER)).toBe("Baked at 5:30am today");
  });

  it("falls back to days for older bakes", () => {
    expect(freshnessLabel(bakery, { madeAt: new Date("2026-10-23T12:00:00Z") }, NOW, VANCOUVER)).toBe(
      "Baked yesterday at 5am",
    );
    expect(freshnessLabel(bakery, { madeAt: new Date("2026-10-21T12:00:00Z") }, NOW, VANCOUVER)).toBe(
      "Baked 3 days ago",
    );
  });

  it("shows the vintage year for wine", () => {
    expect(freshnessLabel(winery, { madeAt: new Date("2024-09-20T18:00:00Z") }, NOW, VANCOUVER)).toBe("Vintage 2024");
  });
});

describe("extraFieldsSchema", () => {
  const breweryProduct = extraFieldsSchema(getTemplate("brewery").productFields);
  const eggProduct = extraFieldsSchema(getTemplate("poultry").productFields);

  it("accepts and converts valid form values", () => {
    expect(breweryProduct.parse({ style: "Hazy Pale Ale", abv: "6.2", ibu: "" })).toEqual({
      style: "Hazy Pale Ale",
      abv: 6.2,
    });
  });

  it("requires fields the template marks as required", () => {
    expect(breweryProduct.safeParse({ style: "Lager" }).success).toBe(false);
  });

  it("rejects non-numbers in number fields", () => {
    expect(breweryProduct.safeParse({ abv: "strong" }).success).toBe(false);
  });

  it("only accepts listed options in select fields", () => {
    expect(eggProduct.safeParse({ size: "Large" }).success).toBe(true);
    expect(eggProduct.safeParse({ size: "Huge" }).success).toBe(false);
  });

  it("drops keys the template does not define", () => {
    expect(breweryProduct.parse({ abv: "5", secret: "x" })).toEqual({ abv: 5 });
  });
});

describe("optionLabel", () => {
  it("finds the label for an option id, falling back to the id", () => {
    const types = getTemplate("brewery").sourceTypes;
    expect(optionLabel(types, "hop-farm")).toBe("Hop farm");
    expect(optionLabel(types, "unknown")).toBe("unknown");
  });
});
