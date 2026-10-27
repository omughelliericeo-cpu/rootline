// Zod schemas for sharing a photo (public) and reviewing one (producer).
import { z } from "zod";
import { optionalText, requiredFile } from "@/lib/form";
import { FIRST_NAME_MAX, NOTE_MAX } from "./service";

export const sharePhotoSchema = z.object({
  batchCode: z.string().min(1).max(20),
  photo: requiredFile,
  note: optionalText("Your note", NOTE_MAX),
  firstName: optionalText("First name", FIRST_NAME_MAX),
  consent: z.literal("on", { error: "Tick the box to agree" }),
  /** Trap field, hidden from people (see looksLikeABot). */
  website: z.string().max(500).optional(),
});

export const reviewPhotoSchema = z.object({
  photoId: z.uuid(),
  decision: z.enum(["approve", "reject"]),
});

export const removePhotoSchema = z.object({ photoId: z.uuid() });
