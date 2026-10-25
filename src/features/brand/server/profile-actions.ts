"use server";
// Server actions for the brand profile: text details, logo and photos.
import { revalidatePath } from "next/cache";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { uploadBrandImage } from "@/lib/storage";
import { brandProfileSchema, imageUploadSchema, removePhotoSchema } from "../schema";
import { canAddPhoto, withoutPhoto } from "../service";
import { cleanUpMedia, saveWithUpload } from "@/lib/media-cleanup";

export const saveBrandProfile = defineOwnerAction({
  feature: "brand",
  action: "saveProfile",
  input: brandProfileSchema,
  handler: async (input, { owner }) => {
    await withTenant(tenantOf(owner), (tx) =>
      tx.brand.update({
        where: { id: owner.brandId },
        data: {
          name: input.name,
          location: input.location,
          latitude: input.coordinates?.latitude ?? null,
          longitude: input.coordinates?.longitude ?? null,
          colorPrimary: input.colorPrimary,
          colorAccent: input.colorAccent,
          quote: input.quote ?? null,
          videoUrl: input.videoUrl ?? null,
        },
      }),
    );
    revalidatePath("/", "layout");
    return { message: "Profile saved." };
  },
});

export const uploadBrandLogo = defineOwnerAction({
  feature: "brand",
  action: "uploadLogo",
  input: imageUploadSchema,
  handler: async ({ file }, ctx) => {
    const { owner } = ctx;
    const newPath = await uploadBrandImage(owner.brandId, "logo", file);
    const previous = await saveWithUpload(newPath, ctx, "uploadLogo", () =>
      withTenant(tenantOf(owner), async (tx) => {
        const brand = await tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { logoPath: true } });
        await tx.brand.update({ where: { id: owner.brandId }, data: { logoPath: newPath } });
        return brand.logoPath;
      }),
    );
    await cleanUpMedia([previous], ctx, "uploadLogo");
    revalidatePath("/brand");
    return { message: "Logo updated." };
  },
});

export const removeBrandLogo = defineOwnerAction({
  feature: "brand",
  action: "removeLogo",
  input: removePhotoSchema.partial(),
  handler: async (_input, ctx) => {
    const { owner } = ctx;
    const previous = await withTenant(tenantOf(owner), async (tx) => {
      const brand = await tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { logoPath: true } });
      await tx.brand.update({ where: { id: owner.brandId }, data: { logoPath: null } });
      return brand.logoPath;
    });
    await cleanUpMedia([previous], ctx, "removeLogo");
    revalidatePath("/brand");
    return { message: "Logo removed." };
  },
});

export const addBrandPhoto = defineOwnerAction({
  feature: "brand",
  action: "addPhoto",
  input: imageUploadSchema,
  handler: async ({ file }, ctx) => {
    const { owner } = ctx;
    const current = await withTenant(tenantOf(owner), (tx) =>
      tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { photoPaths: true } }),
    );
    if (!canAddPhoto(current.photoPaths.length)) throw new AppError("BRAND_PHOTO_LIMIT");

    const newPath = await uploadBrandImage(owner.brandId, "photo", file);
    await saveWithUpload(newPath, ctx, "addPhoto", () =>
      withTenant(tenantOf(owner), (tx) =>
        tx.brand.update({ where: { id: owner.brandId }, data: { photoPaths: { push: newPath } } }),
      ),
    );
    revalidatePath("/brand");
    return { message: "Photo added." };
  },
});

export const removeBrandPhoto = defineOwnerAction({
  feature: "brand",
  action: "removePhoto",
  input: removePhotoSchema,
  handler: async ({ path }, ctx) => {
    const { owner } = ctx;
    await withTenant(tenantOf(owner), async (tx) => {
      const brand = await tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { photoPaths: true } });
      const remaining = withoutPhoto(brand.photoPaths, path);
      if (!remaining) throw new AppError("NOT_FOUND", "That photo is no longer on your profile.");
      await tx.brand.update({ where: { id: owner.brandId }, data: { photoPaths: remaining } });
    });
    await cleanUpMedia([path], ctx, "removePhoto");
    revalidatePath("/brand");
    return { message: "Photo removed." };
  },
});
