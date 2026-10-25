// Zod schemas for product forms. Industry-specific fields arrive as
// `extra.*` and are checked against the template in the server action.
import { z } from "zod";
import { optionalFile, optionalText, requiredText, stringList } from "@/lib/form";

export const productSchema = z.object({
  name: requiredText("Name", 100),
  format: requiredText("Format", 80),
  ingredients: stringList,
  ingredientsOther: optionalText("Other ingredients", 500),
  allergens: stringList,
  allergensOther: optionalText("Other allergens", 300),
  dietaryTags: stringList,
  extra: z.record(z.string(), z.unknown()).default({}),
  photo: optionalFile,
});

export const updateProductSchema = productSchema.extend({ productId: z.uuid() });

export const productIdSchema = z.object({ productId: z.uuid() });

export type ProductInput = z.infer<typeof productSchema>;
