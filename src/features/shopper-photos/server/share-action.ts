"use server";
// Public action (no login): a shopper shares a photo from a story page.
// The photo's hidden metadata (EXIF, GPS) is removed before it is stored, it
// goes to a private bucket, and nothing is public until the producer approves.
import { headers } from "next/headers";
import { BILLING_SELECT, brandCan } from "@/features/billing";
import { defineAction } from "@/lib/action";
import { isPublicCode } from "@/lib/codes";
import { isPolicyViolation, withPublic } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ImageFormatError, stripImageMetadata } from "@/lib/image-metadata";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { removeShopperPhotos, uploadShopperPhoto } from "@/lib/storage";
import { checkImageFile } from "@/lib/storage-rules";
import { sharePhotoSchema } from "../schema";
import { SHARES_PER_VISITOR, THANKS_MESSAGE, consentText, firstNameOnly, looksLikeABot, visitorKey } from "../service";

const limiter = createRateLimiter(SHARES_PER_VISITOR);

export const sharePhoto = defineAction({
  feature: "shopper-photos",
  action: "share",
  input: sharePhotoSchema,
  handler: async ({ batchCode, photo, note, firstName, website }, ctx) => {
    // Bots get the same answer as people, so they learn nothing.
    if (looksLikeABot(website)) return { message: THANKS_MESSAGE };
    if (!isPublicCode(batchCode)) throw new AppError("BATCH_NOT_FOUND");
    if (!limiter.allow(visitorKey(await headers()))) throw new AppError("SHOPPER_PHOTO_RATE_LIMITED");
    const problem = checkImageFile(photo);
    if (problem) throw new AppError("UPLOAD_INVALID", problem);

    // Row-level security only shows published batches in public mode.
    const batch = await withPublic((tx) =>
      tx.batch.findUnique({ where: { code: batchCode }, select: { id: true, brandId: true, brand: { select: { name: true, ...BILLING_SELECT } } } }),
    );
    if (!batch) throw new AppError("BATCH_NOT_FOUND");
    ctx.setBrandId(batch.brandId);
    if (!brandCan(batch.brand, "shopperPhotos")) throw new AppError("PLAN_FEATURE", "This producer isn't collecting shopper photos.");

    const clean = removeMetadata(new Uint8Array(await photo.arrayBuffer()), photo.type);
    const path = await uploadShopperPhoto(batch.brandId, new Blob([clean], { type: photo.type }));
    try {
      // createMany: inserts without reading the row back (the public may not read waiting photos).
      await withPublic((tx) =>
        tx.shopperPhoto.createMany({
          data: [{ brandId: batch.brandId, batchId: batch.id, photoPath: path, note, firstName: firstNameOnly(firstName), consentText: consentText(batch.brand.name) }],
        }),
      );
    } catch (error) {
      await removeShopperPhotos([path]).catch((removeError: unknown) =>
        logger.warn("unused shopper photo not removed", { feature: "shopper-photos", action: "share", requestId: ctx.requestId, path, error: removeError }),
      );
      // The database refuses new photos while 50 are already waiting on this batch.
      if (isPolicyViolation(error)) throw new AppError("SHOPPER_PHOTO_INBOX_FULL", undefined, { cause: error });
      throw error;
    }
    return { message: THANKS_MESSAGE };
  },
});

function removeMetadata(bytes: Uint8Array, type: string) {
  try {
    return stripImageMetadata(bytes, type);
  } catch (error) {
    if (error instanceof ImageFormatError) {
      throw new AppError("UPLOAD_INVALID", "That photo could not be read. Try a JPG, PNG or WebP picture.", { cause: error });
    }
    throw error;
  }
}
