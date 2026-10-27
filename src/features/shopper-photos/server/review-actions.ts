"use server";
// Producer actions: approve or reject a photo waiting for review, and remove
// an approved one. Rejected and removed photos are deleted, row and file.
import { revalidatePath } from "next/cache";
import { defineOwnerAction, type ActionContext } from "@/lib/action";
import { tenantOf } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { cleanUpMedia } from "@/lib/media-cleanup";
import { logger } from "@/lib/logger";
import { publishShopperPhoto, removeShopperPhotos } from "@/lib/storage";
import { removePhotoSchema, reviewPhotoSchema } from "../schema";

export const reviewShopperPhoto = defineOwnerAction({
  feature: "shopper-photos",
  action: "review",
  input: reviewPhotoSchema,
  handler: async ({ photoId, decision }, ctx) => {
    const tenant = tenantOf(ctx.owner);
    const photo = await withTenant(tenant, (tx) =>
      tx.shopperPhoto.findFirst({ where: { id: photoId, status: "PENDING" }, select: { id: true, photoPath: true } }),
    );
    if (!photo) throw new AppError("SHOPPER_PHOTO_NOT_FOUND");

    if (decision === "approve") {
      // Same path, public bucket. If saving fails, the public copy is removed again.
      await publishShopperPhoto(photo.photoPath);
      try {
        await withTenant(tenant, (tx) => tx.shopperPhoto.update({ where: { id: photo.id }, data: { status: "APPROVED", approvedAt: new Date() } }));
      } catch (error) {
        await cleanUpMedia([photo.photoPath], ctx, "review");
        throw error;
      }
    } else {
      await withTenant(tenant, (tx) => tx.shopperPhoto.delete({ where: { id: photo.id } }));
    }
    await removePrivateCopy(photo.photoPath, ctx);
    revalidatePath("/shopper-photos");
    return { message: decision === "approve" ? "Approved. It now shows on the story page." : "Rejected. The photo has been deleted." };
  },
});

export const removeShopperPhoto = defineOwnerAction({
  feature: "shopper-photos",
  action: "remove",
  input: removePhotoSchema,
  handler: async ({ photoId }, ctx) => {
    const photo = await withTenant(tenantOf(ctx.owner), async (tx) => {
      const found = await tx.shopperPhoto.findFirst({ where: { id: photoId, status: "APPROVED" }, select: { id: true, photoPath: true } });
      if (found) await tx.shopperPhoto.delete({ where: { id: found.id } });
      return found;
    });
    if (!photo) throw new AppError("SHOPPER_PHOTO_NOT_FOUND", "That photo has already been removed.");
    await cleanUpMedia([photo.photoPath], ctx, "remove");
    revalidatePath("/shopper-photos");
    return { message: "Removed from the story page and deleted." };
  },
});

/** The waiting copy is no longer needed. A failure only leaves a private, unused file. */
async function removePrivateCopy(path: string, ctx: ActionContext) {
  try {
    await removeShopperPhotos([path]);
  } catch (error) {
    logger.warn("private shopper photo not removed", { feature: "shopper-photos", action: "review", requestId: ctx.requestId, brandId: ctx.brandId, path, error });
  }
}
