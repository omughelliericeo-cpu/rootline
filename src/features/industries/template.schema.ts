// The one Zod schema every industry template must pass. A template only
// changes words, extra fields, dates, badges and default journey stops;
// the engine (suppliers, batches, story page...) is shared by all industries.
import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "ids are lowercase-with-dashes");
const label = z.string().min(1).max(60);

/** A choice with a stable id (stored in the database) and a display label. */
export const optionSchema = z.object({ id, label });

/** An industry-specific field stored in a product's or batch's `extra` JSON column. */
export const fieldDefinitionSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, "field keys are camelCase"),
  label,
  kind: z.enum(["text", "number", "select", "date"]),
  options: z.array(z.string().min(1)).optional(),
  unit: z.string().max(10).optional(),
  hint: z.string().max(120).optional(),
  required: z.boolean().default(false),
});

export const templateSchema = z
  .object({
    id,
    /** Shown on the "What do you make?" cards. */
    name: label,
    /** One line under the name on those cards, e.g. "Beer, cider and kombucha". */
    description: z.string().min(1).max(80),
    labels: z.object({
      place: label, // "Brewery", "Roastery", "Farm"
      maker: label, // "Brewer", "Baker"
      product: label, // "Beer"
      products: label, // "Beers"
      batch: label, // "Brew"
      batches: label, // "Brews"
    }),
    sourceTypes: z.array(optionSchema).min(1),
    productFields: z.array(fieldDefinitionSchema),
    batchFields: z.array(fieldDefinitionSchema),
    /** Labels for the two shared date columns; `packaged: null` hides the second date. */
    dates: z.object({
      made: z.object({
        label,
        includesTime: z.boolean().default(false),
        /** Verb for the story headline when the date label would read wrongly with a person ("Collected by Ana", not "Laid by Ana"). */
        byVerb: label.optional(),
      }),
      packaged: z.object({ label }).nullable(),
    }),
    /** How the story page phrases freshness, e.g. "Canned 9 days ago". */
    freshness: z.object({
      from: z.enum(["madeAt", "packagedAt"]),
      style: z.enum(["daysAgo", "timeToday", "year"]),
      verb: label, // "Canned", "Baked", "Vintage"
    }),
    /** Claims that may appear as badges, and only with a valid certificate. */
    allowedBadges: z.array(optionSchema).min(1),
    defaultStopTypes: z.array(optionSchema).min(2),
    /** The stop type that is the producer's own place (pre-filled with the brand's location). */
    ownStopType: id,
    starterIngredients: z.array(z.string().min(1)),
    starterAllergens: z.array(z.string().min(1)),
    dietaryTags: z.array(z.string().min(1)),
  })
  .superRefine((template, ctx) => {
    // Freshness counted from the packaged date needs a packaged date to exist.
    if (template.freshness.from === "packagedAt" && template.dates.packaged === null) {
      ctx.addIssue({ code: "custom", path: ["freshness", "from"], message: "packagedAt needs dates.packaged" });
    }
    if (!template.defaultStopTypes.some((stop) => stop.id === template.ownStopType)) {
      ctx.addIssue({ code: "custom", path: ["ownStopType"], message: "ownStopType must be one of defaultStopTypes" });
    }
    for (const field of [...template.productFields, ...template.batchFields]) {
      if (field.kind === "select" && !field.options?.length) {
        ctx.addIssue({ code: "custom", path: ["fields", field.key], message: "select fields need options" });
      }
    }
  });

export type IndustryTemplate = z.infer<typeof templateSchema>;
/** What a template file is written as; defaults (e.g. `required`) may be left out. */
export type IndustryTemplateInput = z.input<typeof templateSchema>;
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;
export type FreshnessRule = IndustryTemplate["freshness"];
