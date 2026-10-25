// Product rules: building ingredient and allergen lists from the tick-boxes
// plus the "other" text box, and splitting them again for editing.

/**
 * Ticked items first (in the order shown), then anything typed in "other"
 * (comma or new line separated). Duplicates are dropped, ignoring case.
 */
export function mergeList(ticked: string[], otherText: string | undefined): string[] {
  const typed = (otherText ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of [...ticked, ...typed]) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** For the edit form: which saved items are tick-boxes, and the rest as "other" text. */
export function splitKnown(values: string[], known: string[]): { ticked: string[]; other: string } {
  const knownKeys = new Set(known.map((item) => item.toLowerCase()));
  const ticked = values.filter((value) => knownKeys.has(value.toLowerCase()));
  const other = values.filter((value) => !knownKeys.has(value.toLowerCase()));
  return { ticked, other: other.join(", ") };
}

/** Dietary tags must come from the template's list; returns any that do not. */
export function unknownTags(tags: string[], allowed: string[]): string[] {
  return tags.filter((tag) => !allowed.includes(tag));
}

/** Prefixes field-error keys, e.g. { abv: [...] } -> { "extra.abv": [...] }, to match form field names. */
export function prefixFieldErrors(errors: Record<string, string[]>, prefix: string): Record<string, string[]> {
  return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [`${prefix}${key}`, messages]));
}
