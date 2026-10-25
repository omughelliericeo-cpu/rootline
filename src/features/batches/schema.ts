// Zod schemas for the batch forms. Rows of lots and stops arrive as parallel
// lists (supplierId[], lotNumber[], ...) and are checked in rows.ts.
import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date");
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

/** A list of form values where blanks are kept, so rows stay lined up. */
const column = z.preprocess(
  (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]),
  z.array(z.string().max(300)).max(100),
);

const detailsFields = {
  number: z.coerce.number({ error: "Enter a number" }).int("Use a whole number").min(1, "Use 1 or more").max(999_999),
  madeOn: dateKey,
  madeTime: z.preprocess(blankToUndefined, z.string().regex(/^\d{2}:\d{2}$/, "Enter a time").optional()),
  packagedOn: z.preprocess(blankToUndefined, dateKey.optional()),
  extra: z.record(z.string(), z.unknown()).default({}),
};

export const createBatchSchema = z.object({ productId: z.uuid("Choose a product"), ...detailsFields });

export const updateBatchSchema = z.object({ batchId: z.uuid(), ...detailsFields });

export type BatchDetailsInput = z.infer<typeof updateBatchSchema>;

export const saveLotsSchema = z.object({
  batchId: z.uuid(),
  supplierId: column,
  ingredient: column,
  lotNumber: column,
  /** Which button was pressed: carry on to printing, or stay on the page. */
  then: z.enum(["print", "stay"]).default("stay"),
});

export const saveStopsSchema = z.object({
  batchId: z.uuid(),
  name: column,
  type: column,
  address: column,
  coordinates: column,
  arrivedOn: column,
  note: column,
});

export const changeStatusSchema = z.object({
  batchId: z.uuid(),
  status: z.enum(["DRAFT", "LIVE", "SOLD_OUT"]),
});

export const batchIdSchema = z.object({ batchId: z.uuid() });
