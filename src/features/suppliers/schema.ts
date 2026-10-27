// Zod schemas for supplier forms. The source type is checked against the
// brand's industry template in the server action.
import { z } from "zod";
import { optionalFile, requiredText } from "@/lib/form";
import { parseCoordinates } from "./service";

export const supplierSchema = z.object({
  name: requiredText("Name", 100),
  sourceType: z.string({ error: "Choose a type" }).min(1, "Choose a type"),
  supplies: requiredText("What they supply", 120),
  address: requiredText("Address", 200),
  coordinates: z
    .string({ error: "Enter the map position" })
    .transform((text, ctx) => {
      const parsed = parseCoordinates(text);
      if (!parsed) {
        ctx.addIssue({ code: "custom", message: "Enter latitude and longitude, e.g. 50.4148, -119.1937" });
        return z.NEVER;
      }
      return parsed;
    }),
  /** Optional photo of the farm or supplier; uploading a new one replaces the old. */
  photo: optionalFile,
});

export const updateSupplierSchema = supplierSchema.extend({ supplierId: z.uuid() });

export const supplierIdSchema = z.object({ supplierId: z.uuid() });

export type SupplierInput = z.infer<typeof supplierSchema>;
