// Business rules driven by templates: the freshness line on the story page,
// and validation for the industry-specific `extra` fields. Pure functions.
import { z } from "zod";
import type { FieldDefinition, FreshnessRule } from "./template.schema";

export type BatchDates = { madeAt: Date; packagedAt?: Date | null };

/** Older than this, "N days ago" stops being useful; show the month instead. */
const MAX_DAYS_AGO = 60;

/**
 * The freshness line, e.g. "Canned 9 days ago", "Baked at 5am today",
 * "Vintage 2024". Days are counted in the brand's time zone, so "today" means
 * today where the product was made. Returns null when the date is missing.
 */
export function freshnessLabel(rule: FreshnessRule, dates: BatchDates, now: Date, timeZone: string): string | null {
  const date = rule.from === "packagedAt" ? dates.packagedAt : dates.madeAt;
  if (!date) return null;

  if (rule.style === "year") return `${rule.verb} ${localParts(date, timeZone).year}`;

  // A date in the future (clock drift, typo) is shown as today rather than "in -2 days".
  const days = Math.max(0, calendarDaysBetween(date, now, timeZone));

  if (rule.style === "timeToday" && days <= 1) {
    const time = shortTime(date, timeZone);
    return days === 0 ? `${rule.verb} at ${time} today` : `${rule.verb} yesterday at ${time}`;
  }
  if (days === 0) return `${rule.verb} today`;
  if (days === 1) return `${rule.verb} yesterday`;
  if (days < MAX_DAYS_AGO) return `${rule.verb} ${days} days ago`;
  return `${rule.verb} in ${monthYear(date, timeZone)}`;
}

/** Whole calendar days from `earlier` to `later`, in the given time zone. */
export function calendarDaysBetween(earlier: Date, later: Date, timeZone: string): number {
  const a = localParts(earlier, timeZone);
  const b = localParts(later, timeZone);
  const DAY_MS = 86_400_000;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS);
}

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "numeric", day: "numeric" })
    .formatToParts(date)
    .reduce<Record<string, number>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = Number(part.value);
      return acc;
    }, {});
  return { year: parts.year!, month: parts.month!, day: parts.day! };
}

/** "5am", "5:30pm" */
function shortTime(date: Date, timeZone: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  return formatted.replace(":00", "").replace(/\s/g, "").toLowerCase();
}

function monthYear(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, month: "long", year: "numeric" }).format(date);
}

/** Form inputs send "" for an empty field; treat that as "not filled in". */
const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

function fieldSchema(field: FieldDefinition): z.ZodType {
  const base = (() => {
    switch (field.kind) {
      case "text":
        return z.string().trim().max(120, `${field.label} must be 120 characters or fewer`);
      case "number":
        return z.coerce.number({ error: `${field.label} must be a number` }).min(0).max(100_000);
      case "date":
        return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${field.label} must be a date`);
      case "select":
        return z.enum(field.options as [string, ...string[]], { error: `Choose a ${field.label.toLowerCase()}` });
    }
  })();
  const valueSchema = field.required ? base : base.optional();
  return z.preprocess(emptyToUndefined, valueSchema);
}

/**
 * Builds the Zod schema for a product's or batch's `extra` JSON column from
 * the template's field list. Unknown keys are dropped, so the column only
 * ever holds fields the template defines.
 */
export function extraFieldsSchema(fields: FieldDefinition[]) {
  return z.object(Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field)])));
}

/** True when `id` is one of the template's options (e.g. a valid source type for this industry). */
export function hasOption(options: Array<{ id: string }>, id: string): boolean {
  return options.some((option) => option.id === id);
}

/** Display label for a stored option id (source type, stop type, badge). */
export function optionLabel(options: Array<{ id: string; label: string }>, id: string): string {
  return options.find((option) => option.id === id)?.label ?? id;
}
