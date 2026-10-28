// Tests for batch rules: numbering, default lots and stops, publishing and status changes.
import { describe, expect, it } from "vitest";
import { getTemplate } from "@/features/industries";
import {
  batchName,
  canChangeStatus,
  canDelete,
  defaultLotsFor,
  defaultStopsFor,
  nextBatchNumber,
  publishProblems,
  type StopDraft,
} from "../service";

const brewery = getTemplate("brewery");
const brand = { name: "Cedar & Tide Brewing", location: "Port Moody, BC", latitude: 49.2838, longitude: -122.8317 };

const stop = (over: Partial<StopDraft> = {}): StopDraft => ({
  name: "Port Moody brewery",
  type: "brewery",
  address: "2711 Murray St, Port Moody",
  latitude: 49.2838,
  longitude: -122.8317,
  arrivedOn: "2026-10-10",
  note: null,
  ...over,
});

describe("batch numbers and names", () => {
  it("continues from the highest number for the product", () => {
    expect(nextBatchNumber([212, 214, 213])).toBe(215);
    expect(nextBatchNumber([])).toBe(1);
  });

  it("names a batch in the industry's words", () => {
    expect(batchName("Hazy Pale Ale", brewery.labels.batch, 214)).toBe("Hazy Pale Ale, Brew 214");
  });
});

describe("defaultLotsFor", () => {
  it("copies the previous batch's lots", () => {
    const previous = [
      { supplierId: "s1", ingredient: "Pilsner malt", lotNumber: "KF-118" },
      { supplierId: "s2", ingredient: "Citra hops", lotNumber: "SH-42" },
    ];
    expect(defaultLotsFor(previous)).toEqual(previous);
  });

  it("returns copies, so editing the new batch cannot change the old one", () => {
    const previous = [{ supplierId: "s1", ingredient: "Malt", lotNumber: "1" }];
    const copied = defaultLotsFor(previous);
    copied[0]!.lotNumber = "2";
    expect(previous[0]!.lotNumber).toBe("1");
  });

  it("starts empty for a product's first batch", () => {
    expect(defaultLotsFor([])).toEqual([]);
  });
});

describe("defaultStopsFor", () => {
  it("copies the previous batch's stops without their dates", () => {
    const stops = defaultStopsFor([stop(), stop({ name: "Coquitlam cold storage", type: "cold-storage" })], brewery, brand);
    expect(stops.map((s) => s.name)).toEqual(["Port Moody brewery", "Coquitlam cold storage"]);
    expect(stops.every((s) => s.arrivedOn === null)).toBe(true);
  });

  it("starts a first batch with one stop: the brand's own place", () => {
    const stops = defaultStopsFor([], brewery, brand);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toMatchObject({ type: "brewery", name: "Cedar & Tide Brewing", address: "Port Moody, BC", latitude: 49.2838 });
  });

  it("uses the template's own-place stop type, not the first in the list", () => {
    // Coffee journeys start at the farm; the roastery is the producer's own place.
    expect(defaultStopsFor([], getTemplate("coffee"), brand)[0]?.type).toBe("roastery");
  });
});

describe("publishProblems", () => {
  const lots = [{ supplierId: "s1", ingredient: "Malt", lotNumber: "KF-118" }];
  const packagedAt = new Date("2026-10-15T19:00:00Z");

  it("is empty when the batch is complete", () => {
    expect(publishProblems({ lots, stops: [stop()], packagedAt, template: brewery })).toEqual([]);
  });

  it("requires a supplier lot, so the journey starts at a proven source", () => {
    expect(publishProblems({ lots: [], stops: [stop()], packagedAt, template: brewery })[0]).toMatch(/supplier lot/);
  });

  it("requires every stop to have an address and map position", () => {
    const problems = publishProblems({ lots, stops: [stop(), stop({ name: "Store", latitude: null })], packagedAt, template: brewery });
    expect(problems).toEqual(["Stop 2 (Store) needs an address and map position."]);
  });

  it("requires the packaged date when freshness counts from it", () => {
    expect(publishProblems({ lots, stops: [stop()], packagedAt: null, template: brewery })).toEqual([
      "Add the canned date, which the freshness line uses.",
    ]);
  });

  it("does not require a packaged date for industries that count from the made date", () => {
    expect(publishProblems({ lots, stops: [stop({ type: "studio" })], packagedAt: null, template: getTemplate("cosmetics") })).toEqual([]);
  });
});

describe("status changes", () => {
  it("allows publish, sold out, back on sale and take offline", () => {
    expect(canChangeStatus("DRAFT", "LIVE")).toBe(true);
    expect(canChangeStatus("LIVE", "SOLD_OUT")).toBe(true);
    expect(canChangeStatus("SOLD_OUT", "LIVE")).toBe(true);
    expect(canChangeStatus("LIVE", "DRAFT")).toBe(true);
  });

  it("does not skip straight from draft to sold out", () => {
    expect(canChangeStatus("DRAFT", "SOLD_OUT")).toBe(false);
  });

  it("only lets drafts be deleted", () => {
    expect(canDelete("DRAFT")).toBe(true);
    expect(canDelete("LIVE")).toBe(false);
    expect(canDelete("SOLD_OUT")).toBe(false);
  });
});
