// Zod schemas for shelf code forms.
import { z } from "zod";
import { requiredText } from "@/lib/form";

const optionalBatchId = z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional());

export const createShelfCodeSchema = z.object({
  label: requiredText("Where it goes", 60),
  batchId: optionalBatchId,
});

export const pointShelfCodeSchema = z.object({
  shelfCodeId: z.uuid(),
  batchId: optionalBatchId,
});

export const shelfCodeIdSchema = z.object({ shelfCodeId: z.uuid() });
