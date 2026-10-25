// Helpers for HTML forms: converting FormData to a plain object, and Zod
// building blocks that understand how browsers send form values ("" for an
// empty field, an empty File for an empty file input).
import { z } from "zod";

/**
 * FormData -> plain object for Zod.
 *  - Keys ending in "[]" become arrays (name="allergens[]" on several checkboxes).
 *  - One dot nests one level (name="extra.abv" -> { extra: { abv } }), used
 *    for industry-specific fields.
 *  - Next.js's own hidden "$ACTION..." fields are skipped.
 */
export function formDataToObject(form: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("$ACTION")) continue;
    const dot = key.indexOf(".");
    const target =
      dot > 0 ? ((result[key.slice(0, dot)] ??= {}) as Record<string, unknown>) : result;
    const name = dot > 0 ? key.slice(dot + 1) : key;
    if (name.endsWith("[]")) {
      const listName = name.slice(0, -2);
      const list = (target[listName] as unknown[] | undefined) ?? [];
      list.push(value);
      target[listName] = list;
    } else {
      target[name] = value;
    }
  }
  return result;
}

/** Checkbox groups: no box ticked means the key is missing entirely. */
export const stringList = z.preprocess(
  (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]),
  z.array(z.string().trim().min(1).max(80)).max(60),
);

const blankToUndefined = (value: unknown) =>
  value === "" || value === null || (value instanceof File && value.size === 0) ? undefined : value;

/** A required, trimmed text field. */
export function requiredText(label: string, max = 200) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

/** An optional text field; an empty input becomes undefined. */
export function optionalText(label: string, max = 200) {
  return z.preprocess(blankToUndefined, z.string().trim().max(max, `${label} must be ${max} characters or fewer`).optional());
}

/** An optional number field (e.g. latitude); an empty input becomes undefined. */
export function optionalNumber(label: string, min: number, max: number) {
  return z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: `${label} must be a number` })
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );
}

/** An optional file input; an empty file input becomes undefined. */
export const optionalFile = z.preprocess(blankToUndefined, z.instanceof(File).optional());

/** A required file input. */
export const requiredFile = z.preprocess(blankToUndefined, z.instanceof(File, { error: "Choose a file to upload" }));
