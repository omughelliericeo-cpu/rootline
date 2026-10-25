// Zod schemas for brand profile forms. Used by the server actions; the same
// limits are mirrored in the form inputs (maxLength etc.) for quick feedback.
import { z } from "zod";
import { industryIdSchema } from "@/features/industries";
import { parseCoordinates } from "@/lib/coordinates";
import { optionalFile, optionalText, requiredFile, requiredText } from "@/lib/form";
import { isSupportedVideoUrl } from "./service";

const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a colour");

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const brandProfileSchema = z
  .object({
    name: requiredText("Brand name", 80),
    location: requiredText("Location", 120),
    /** Optional "latitude, longitude"; used for the producer's own stop on journeys. */
    coordinates: z.preprocess(
      blankToUndefined,
      z
        .string()
        .transform((text, ctx) => {
          const parsed = parseCoordinates(text);
          if (!parsed) {
            ctx.addIssue({ code: "custom", message: "Enter latitude and longitude, e.g. 49.2838, -122.8317" });
            return z.NEVER;
          }
          return parsed;
        })
        .optional(),
    ),
    colorPrimary: hexColour,
    colorAccent: hexColour,
    quote: optionalText("Quote", 280),
    videoUrl: z.preprocess(
      blankToUndefined,
      z.url("Enter a full link starting with https://").refine(isSupportedVideoUrl, "Use a YouTube or Vimeo link").optional(),
    ),
  });

export type BrandProfileInput = z.infer<typeof brandProfileSchema>;

/** The brand created during sign-up. */
export const newBrandSchema = z.object({
  userId: z.uuid(),
  industry: industryIdSchema,
  name: requiredText("Brand name", 80),
  location: requiredText("Location", 120),
});

export type NewBrandInput = z.infer<typeof newBrandSchema>;

export const imageUploadSchema = z.object({ file: requiredFile });

export const removePhotoSchema = z.object({ path: z.string().min(1) });

export const addPersonSchema = z.object({
  name: requiredText("Name", 80),
  role: requiredText("Role", 80),
  photo: optionalFile,
});

export const updatePersonSchema = addPersonSchema.extend({ personId: z.uuid() });

export const personIdSchema = z.object({ personId: z.uuid() });
