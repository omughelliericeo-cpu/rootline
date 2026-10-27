// The compliance record for one batch, and its CSV form. One record feeds
// both the CSV and the PDF, so they always contain the same facts.
// Pure functions, unit tested. Wording comes from the industry template.
import type { IndustryTemplate } from "@/features/industries";
import { optionLabel } from "@/features/industries";

export type ComplianceRecord = {
  title: string;
  details: Array<[label: string, value: string]>;
  lots: Array<{ supplier: string; type: string; supplied: string; lotNumber: string; address: string; latitude: number; longitude: number }>;
  stops: Array<{ name: string; type: string; address: string; latitude: number | null; longitude: number | null; date: string; note: string }>;
  exportedAt: string;
};

type Input = {
  template: IndustryTemplate;
  brand: { name: string; location: string };
  product: { name: string; format: string; ingredients: string[]; allergens: string[]; extra: Record<string, unknown> };
  batch: { number: number; code: string; status: string; madeOn: string; packagedOn: string | null; extra: Record<string, unknown> };
  lots: Array<{ supplierName: string; sourceType: string; ingredient: string; lotNumber: string; address: string; latitude: number; longitude: number }>;
  stops: Array<{ name: string; type: string; address: string; latitude: number | null; longitude: number | null; arrivedOn: string | null; note: string | null }>;
  exportedAt: Date;
};

const STATUS_WORDS: Record<string, string> = { DRAFT: "Draft", LIVE: "Live", SOLD_OUT: "Sold out" };

/** Industry fields as "Alcohol (%)": "6.2", skipping ones left empty. */
function extraDetails(fields: IndustryTemplate["productFields"], values: Record<string, unknown>): Array<[string, string]> {
  return fields
    .filter((field) => values[field.key] !== undefined && values[field.key] !== "")
    .map((field) => [field.unit ? `${field.label} (${field.unit})` : field.label, String(values[field.key])]);
}

export function buildComplianceRecord(input: Input): ComplianceRecord {
  const { template, brand, product, batch } = input;
  const { labels, dates } = template;
  const details: Array<[string, string]> = [
    ["Brand", brand.name],
    ["Brand location", brand.location],
    [labels.product, product.name],
    ["Format", product.format],
    ...extraDetails(template.productFields, product.extra),
    [`${labels.batch} number`, String(batch.number)],
    ["Batch code", batch.code],
    ["Status", STATUS_WORDS[batch.status] ?? batch.status],
    [dates.made.label, batch.madeOn],
    ...(dates.packaged ? [[dates.packaged.label, batch.packagedOn ?? "Not recorded"] as [string, string]] : []),
    ...extraDetails(template.batchFields, batch.extra),
    ["Ingredients", product.ingredients.join("; ") || "None listed"],
    ["Allergens", product.allergens.join("; ") || "None listed"],
  ];
  return {
    title: `${product.name}, ${labels.batch} ${batch.number}`,
    details,
    lots: input.lots.map((lot) => ({
      supplier: lot.supplierName,
      type: optionLabel(template.sourceTypes, lot.sourceType),
      supplied: lot.ingredient,
      lotNumber: lot.lotNumber,
      address: lot.address,
      latitude: lot.latitude,
      longitude: lot.longitude,
    })),
    stops: input.stops.map((stop) => ({
      name: stop.name,
      type: optionLabel(template.defaultStopTypes, stop.type),
      address: stop.address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      date: stop.arrivedOn ?? "",
      note: stop.note ?? "",
    })),
    exportedAt: input.exportedAt.toISOString(),
  };
}

/**
 * One CSV cell. Quotes when needed (RFC 4180), and defuses text a
 * spreadsheet would run as a formula (starting with = + - @), so an
 * inspector opening the file never runs anything hidden in a supplier name.
 */
export function csvCell(value: string | number | null): string {
  if (value === null) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const row = (cells: Array<string | number | null>) => cells.map(csvCell).join(",");

/** The CSV: details as label/value rows, then the lots table, then the stops table. */
export function toCsv(record: ComplianceRecord): string {
  const lines = [
    row(["Rootline compliance export", record.title]),
    row(["Exported", record.exportedAt]),
    ...record.details.map(([label, value]) => row([label, value])),
    "",
    row(["Supplier lots"]),
    row(["#", "Supplier", "Type", "Supplied", "Lot number", "Address", "Latitude", "Longitude"]),
    ...record.lots.map((lot, index) => row([index + 1, lot.supplier, lot.type, lot.supplied, lot.lotNumber, lot.address, lot.latitude, lot.longitude])),
    "",
    row(["Journey stops"]),
    row(["#", "Name", "Type", "Address", "Latitude", "Longitude", "Date", "Note"]),
    ...record.stops.map((stop, index) => row([index + 1, stop.name, stop.type, stop.address, stop.latitude, stop.longitude, stop.date, stop.note])),
  ];
  // The byte-order mark makes Excel read accented characters (é, ü) correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
