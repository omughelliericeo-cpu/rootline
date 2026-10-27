// The "where it came from" part of a story: sources (supplier lots), the
// numbered journey stops, and the points drawn on the map. Pure functions.
import { dateFromKey } from "@/lib/dates";

export type SourceView = {
  supplierId: string;
  name: string;
  typeLabel: string;
  supplies: string[];
  lotNumbers: string[];
  address: string;
  latitude: number;
  longitude: number;
  /** Optional photo of the farm or supplier (storage path). */
  photoPath: string | null;
};

export type StopView = {
  number: number;
  name: string;
  typeLabel: string;
  address: string;
  dateText: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** A point on the map. Sources are the start of the journey; stops are numbered 1, 2, 3... */
export type MapPoint = { kind: "source" | "stop"; label: string; name: string; latitude: number; longitude: number };

type Lot = {
  ingredient: string;
  lotNumber: string;
  supplier: { id: string; name: string; sourceType: string; address: string; latitude: number; longitude: number; photoPath: string | null };
};

/** One entry per supplier, listing what came from them and which lots. */
export function sourcesFrom(lots: Lot[], typeLabel: (type: string) => string): SourceView[] {
  const bySupplier = new Map<string, SourceView>();
  for (const lot of lots) {
    const existing = bySupplier.get(lot.supplier.id);
    if (existing) {
      if (!existing.supplies.includes(lot.ingredient)) existing.supplies.push(lot.ingredient);
      existing.lotNumbers.push(lot.lotNumber);
      continue;
    }
    bySupplier.set(lot.supplier.id, {
      supplierId: lot.supplier.id,
      name: lot.supplier.name,
      typeLabel: typeLabel(lot.supplier.sourceType),
      supplies: [lot.ingredient],
      lotNumbers: [lot.lotNumber],
      address: lot.supplier.address,
      latitude: lot.supplier.latitude,
      longitude: lot.supplier.longitude,
      photoPath: lot.supplier.photoPath,
    });
  }
  return [...bySupplier.values()];
}

type Stop = { name: string; type: string; address: string; latitude: number | null; longitude: number | null; arrivedOn: string | null; note: string | null };

export function stopsFrom(stops: Stop[], typeLabel: (type: string) => string): StopView[] {
  // Stop dates are calendar dates (no time), so they are formatted in UTC to keep the same day.
  const format = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
  return stops.map((stop, index) => ({
    number: index + 1,
    name: stop.name,
    typeLabel: typeLabel(stop.type),
    address: stop.address,
    dateText: stop.arrivedOn ? format.format(dateFromKey(stop.arrivedOn)) : null,
    note: stop.note,
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));
}

/** Map points in journey order: sources first, then the numbered stops that have a position. */
export function journeyPoints(sources: SourceView[], stops: StopView[]): MapPoint[] {
  const sourcePoints: MapPoint[] = sources.map((source) => ({
    kind: "source",
    label: "",
    name: `${source.name}: ${source.supplies.join(", ")}`,
    latitude: source.latitude,
    longitude: source.longitude,
  }));
  const stopPoints: MapPoint[] = stops
    .filter((stop) => stop.latitude !== null && stop.longitude !== null)
    .map((stop) => ({ kind: "stop", label: String(stop.number), name: stop.name, latitude: stop.latitude!, longitude: stop.longitude! }));
  return [...sourcePoints, ...stopPoints];
}
