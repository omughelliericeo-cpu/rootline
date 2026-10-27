"use server";
// Server actions to add, edit and delete suppliers (with an optional photo).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTemplate, hasOption } from "@/features/industries";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { isStillReferenced, withTenant } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
import { cleanUpMedia, saveWithUpload } from "@/lib/media-cleanup";
import { uploadBrandImage } from "@/lib/storage";
import { supplierIdSchema, supplierSchema, updateSupplierSchema, type SupplierInput } from "../schema";

/** The source type must be one the brand's industry template offers. */
function toRow(owner: Owner, input: SupplierInput) {
  if (!hasOption(getTemplate(owner.industry).sourceTypes, input.sourceType)) {
    throw new ValidationError({ sourceType: ["Choose a type from the list"] });
  }
  return {
    name: input.name,
    sourceType: input.sourceType,
    supplies: input.supplies,
    address: input.address,
    latitude: input.coordinates.latitude,
    longitude: input.coordinates.longitude,
  };
}

export const createSupplier = defineOwnerAction({
  feature: "suppliers",
  action: "create",
  input: supplierSchema,
  handler: async (input, ctx) => {
    const { owner } = ctx;
    const data = toRow(owner, input);
    const photoPath = input.photo ? await uploadBrandImage(owner.brandId, "supplier", input.photo) : undefined;
    await saveWithUpload(photoPath, ctx, "createSupplier", () =>
      withTenant(tenantOf(owner), (tx) =>
        tx.supplier.create({ data: { ...data, brandId: owner.brandId, photoPath: photoPath ?? null } }),
      ),
    );
    revalidatePath("/suppliers");
    redirect("/suppliers");
  },
});

export const updateSupplier = defineOwnerAction({
  feature: "suppliers",
  action: "update",
  input: updateSupplierSchema,
  handler: async ({ supplierId, ...input }, ctx) => {
    const { owner } = ctx;
    const data = toRow(owner, input);
    const newPhoto = input.photo ? await uploadBrandImage(owner.brandId, "supplier", input.photo) : undefined;
    const previousPhoto = await saveWithUpload(newPhoto, ctx, "updateSupplier", () =>
      withTenant(tenantOf(owner), async (tx) => {
        const existing = await tx.supplier.findFirst({ where: { id: supplierId, brandId: owner.brandId }, select: { photoPath: true } });
        if (!existing) throw new AppError("SUPPLIER_NOT_FOUND");
        await tx.supplier.update({ where: { id: supplierId }, data: { ...data, ...(newPhoto ? { photoPath: newPhoto } : {}) } });
        return newPhoto ? existing.photoPath : null;
      }),
    );
    await cleanUpMedia([previousPhoto], ctx, "updateSupplier");
    revalidatePath("/suppliers");
    return { message: "Supplier saved." };
  },
});

export const deleteSupplier = defineOwnerAction({
  feature: "suppliers",
  action: "delete",
  input: supplierIdSchema,
  handler: async ({ supplierId }, ctx) => {
    const { owner } = ctx;
    let photoPath: string | null = null;
    try {
      photoPath = await withTenant(tenantOf(owner), async (tx) => {
        const existing = await tx.supplier.findFirst({ where: { id: supplierId, brandId: owner.brandId }, select: { photoPath: true } });
        if (!existing) throw new AppError("SUPPLIER_NOT_FOUND");
        await tx.supplier.delete({ where: { id: supplierId } });
        return existing.photoPath;
      });
    } catch (error) {
      if (isStillReferenced(error)) {
        throw new AppError("IN_USE", "This supplier has certificates, or lots used on batches. Remove those first.");
      }
      throw error;
    }
    await cleanUpMedia([photoPath], ctx, "deleteSupplier");
    revalidatePath("/suppliers");
    redirect("/suppliers");
  },
});
