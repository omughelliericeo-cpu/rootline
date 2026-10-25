// Batch rules. Pure functions, unit tested in tests/service.test.ts.
import type { IndustryTemplate } from "@/features/industries";

export type BatchStatus = "DRAFT" | "LIVE" | "SOLD_OUT";

export type LotDraft = { supplierId: string; ingredient: string; lotNumber: string };

export type StopDraft = {
  name: string;
  type: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  /** "YYYY-MM-DD": the day the batch was at this stop. */
  arrivedOn: string | null;
  note: string | null;
};

/** The next batch number for a product: one more than the highest so far, or 1. */
export function nextBatchNumber(existingNumbers: number[]): number {
  return existingNumbers.length === 0 ? 1 : Math.max(...existingNumbers) + 1;
}

/** "Hazy Pale Ale, Brew 214" */
export function batchName(productName: string, batchLabel: string, number: number): string {
  return `${productName}, ${batchLabel} ${number}`;
}

/**
 * Lots for a new batch default to the lots on the previous batch of the same
 * product: most brews use the same suppliers, and often the same lot.
 */
export function defaultLotsFor(previousLots: LotDraft[]): LotDraft[] {
  return previousLots.map(({ supplierId, ingredient, lotNumber }) => ({ supplierId, ingredient, lotNumber }));
}

type OwnPlace = { name: string; location: string; latitude: number | null; longitude: number | null };

/**
 * Journey stops for a new batch: the previous batch's stops (without dates),
 * or, for a product's first batch, the template's default stop types, with
 * the producer's own place filled in from the brand profile.
 */
export function defaultStopsFor(
  previousStops: StopDraft[],
  template: Pick<IndustryTemplate, "defaultStopTypes" | "ownStopType">,
  brand: OwnPlace,
): StopDraft[] {
  // Dates belong to one batch's trip, so they are not copied.
  if (previousStops.length > 0) return previousStops.map((stop) => ({ ...stop, arrivedOn: null }));
  return template.defaultStopTypes.map((stopType) => {
    const isOwnPlace = stopType.id === template.ownStopType;
    return {
      name: isOwnPlace ? brand.name : stopType.label,
      type: stopType.id,
      address: isOwnPlace ? brand.location : "",
      latitude: isOwnPlace ? brand.latitude : null,
      longitude: isOwnPlace ? brand.longitude : null,
      arrivedOn: null,
      note: null,
    };
  });
}

type PublishCheck = {
  lots: LotDraft[];
  stops: StopDraft[];
  packagedAt: Date | null;
  template: Pick<IndustryTemplate, "freshness" | "dates">;
};

/**
 * What still has to be filled in before shoppers can see the batch. Every
 * journey must start at a proven point (a supplier lot), and every stop needs
 * a map position. Empty list = ready to publish.
 */
export function publishProblems({ lots, stops, packagedAt, template }: PublishCheck): string[] {
  const problems: string[] = [];
  if (lots.length === 0) problems.push("Add at least one supplier lot, so the journey starts at a named source.");
  if (stops.length === 0) problems.push("Add at least one journey stop.");
  stops.forEach((stop, index) => {
    if (!stop.address.trim() || stop.latitude === null || stop.longitude === null) {
      problems.push(`Stop ${index + 1} (${stop.name}) needs an address and map position.`);
    }
  });
  if (template.freshness.from === "packagedAt" && !packagedAt && template.dates.packaged) {
    problems.push(`Add the ${template.dates.packaged.label.toLowerCase()} date, which the freshness line uses.`);
  }
  return problems;
}

const TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  DRAFT: ["LIVE"],
  LIVE: ["SOLD_OUT", "DRAFT"],
  SOLD_OUT: ["LIVE"],
};

/** Allowed status changes: publish, mark sold out, back on sale, or take offline. */
export function canChangeStatus(from: BatchStatus, to: BatchStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Only drafts can be deleted: once published, a QR code may already be on shelves. */
export function canDelete(status: BatchStatus): boolean {
  return status === "DRAFT";
}
