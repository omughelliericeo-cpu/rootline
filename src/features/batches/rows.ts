// Turning the repeated rows of the lots and journey forms into lists.
// Each row's inputs share a name with "[]" (supplierId[], lotNumber[], ...),
// so the browser sends parallel lists; these helpers zip them back into rows.
// Completely blank rows (the spare rows at the bottom) are ignored.
import { parseCoordinates } from "@/lib/coordinates";
import type { LotDraft, StopDraft } from "./service";

export type RowErrors = Record<string, string[]>;

function column(values: string[] | undefined, index: number): string {
  return (values?.[index] ?? "").trim();
}

function rowCount(columns: Array<string[] | undefined>): number {
  return Math.max(0, ...columns.map((values) => values?.length ?? 0));
}

export type LotColumns = { supplierId?: string[]; ingredient?: string[]; lotNumber?: string[] };

export function lotRows(columns: LotColumns, knownSupplierIds: Set<string>): { lots: LotDraft[]; errors: RowErrors } {
  const lots: LotDraft[] = [];
  const errors: RowErrors = {};
  for (let i = 0; i < rowCount([columns.supplierId, columns.ingredient, columns.lotNumber]); i++) {
    const supplierId = column(columns.supplierId, i);
    const ingredient = column(columns.ingredient, i);
    const lotNumber = column(columns.lotNumber, i);
    if (!supplierId && !ingredient && !lotNumber) continue;

    const problems: string[] = [];
    if (!knownSupplierIds.has(supplierId)) problems.push("choose a supplier");
    if (!ingredient) problems.push("say what came from them");
    if (!lotNumber) problems.push("enter the lot number");
    if (ingredient.length > 120 || lotNumber.length > 60) problems.push("shorten the text");
    if (problems.length > 0) errors[`lots.${i}`] = [`Row ${i + 1}: ${problems.join(", ")}.`];
    else lots.push({ supplierId, ingredient, lotNumber });
  }
  return { lots, errors };
}

export type StopColumns = {
  name?: string[];
  type?: string[];
  address?: string[];
  coordinates?: string[];
  arrivedOn?: string[];
  note?: string[];
};

export function stopRows(columns: StopColumns, knownTypes: Set<string>): { stops: StopDraft[]; errors: RowErrors } {
  const stops: StopDraft[] = [];
  const errors: RowErrors = {};
  const all = [columns.name, columns.type, columns.address, columns.coordinates, columns.arrivedOn, columns.note];
  for (let i = 0; i < rowCount(all); i++) {
    const name = column(columns.name, i);
    const type = column(columns.type, i);
    const address = column(columns.address, i);
    const coordinatesText = column(columns.coordinates, i);
    const arrivedOn = column(columns.arrivedOn, i);
    const note = column(columns.note, i);
    // A spare row with only its default type chosen still counts as blank.
    if (!name && !address && !coordinatesText && !arrivedOn && !note) continue;

    const problems: string[] = [];
    const coordinates = coordinatesText ? parseCoordinates(coordinatesText) : null;
    if (!name) problems.push("enter a name");
    if (!knownTypes.has(type)) problems.push("choose a type");
    if (coordinatesText && !coordinates) problems.push("enter the map position as latitude, longitude");
    if (arrivedOn && !/^\d{4}-\d{2}-\d{2}$/.test(arrivedOn)) problems.push("enter a valid date");
    if (name.length > 100 || address.length > 200 || note.length > 200) problems.push("shorten the text");
    if (problems.length > 0) {
      errors[`stops.${i}`] = [`Stop ${i + 1}: ${problems.join(", ")}.`];
      continue;
    }
    stops.push({
      name,
      type,
      address,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      arrivedOn: arrivedOn || null,
      note: note || null,
    });
  }
  return { stops, errors };
}
