"use server";
// Server actions to add, edit and delete products.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extraFieldsSchema, getTemplate } from "@/features/industries";
import type { Prisma } from "@/generated/prisma/client";
import { defineOwnerAction, toFieldErrors } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { isStillReferenced, withTenant } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
import { cleanUpMedia, saveWithUpload } from "@/lib/media-cleanup";
import { uploadBrandImage } from "@/lib/storage";
import { productIdSchema, productSchema, updateProductSchema, type ProductInput } from "../schema";
import { mergeList, prefixFieldErrors, unknownTags } from "../service";

/** Checks the template-driven parts of the form and returns the columns to save. */
function toRow(owner: Owner, input: ProductInput) {
  const template = getTemplate(owner.industry);
  const extra = extraFieldsSchema(template.productFields).safeParse(input.extra);
  if (!extra.success) throw new ValidationError(prefixFieldErrors(toFieldErrors(extra.error), "extra."));
  if (unknownTags(input.dietaryTags, template.dietaryTags).length > 0) {
    throw new ValidationError({ dietaryTags: ["Choose dietary tags from the list"] });
  }
  return {
    name: input.name,
    format: input.format,
    ingredients: mergeList(input.ingredients, input.ingredientsOther),
    allergens: mergeList(input.allergens, input.allergensOther),
    dietaryTags: input.dietaryTags,
    extra: extra.data as Prisma.InputJsonObject,
  };
}

export const createProduct = defineOwnerAction({
  feature: "products",
  action: "create",
  input: productSchema,
  handler: async (input, ctx) => {
    const { owner } = ctx;
    const data = toRow(owner, input);
    const photoPath = input.photo ? await uploadBrandImage(owner.brandId, "product", input.photo) : undefined;
    await saveWithUpload(photoPath, ctx, "createProduct", () =>
      withTenant(tenantOf(owner), (tx) =>
        tx.product.create({ data: { ...data, brandId: owner.brandId, photoPath: photoPath ?? null } }),
      ),
    );
    revalidatePath("/products");
    redirect("/products");
  },
});

export const updateProduct = defineOwnerAction({
  feature: "products",
  action: "update",
  input: updateProductSchema,
  handler: async ({ productId, ...input }, ctx) => {
    const { owner } = ctx;
    const data = toRow(owner, input);
    const newPhoto = input.photo ? await uploadBrandImage(owner.brandId, "product", input.photo) : undefined;
    const previousPhoto = await saveWithUpload(newPhoto, ctx, "updateProduct", () =>
      withTenant(tenantOf(owner), async (tx) => {
        const existing = await tx.product.findFirst({ where: { id: productId, brandId: owner.brandId } });
        if (!existing) throw new AppError("PRODUCT_NOT_FOUND");
        await tx.product.update({ where: { id: productId }, data: { ...data, ...(newPhoto ? { photoPath: newPhoto } : {}) } });
        return newPhoto ? existing.photoPath : null;
      }),
    );
    await cleanUpMedia([previousPhoto], ctx, "updateProduct");
    revalidatePath("/products");
    return { message: "Product saved." };
  },
});

export const deleteProduct = defineOwnerAction({
  feature: "products",
  action: "delete",
  input: productIdSchema,
  handler: async ({ productId }, ctx) => {
    const { owner } = ctx;
    let photoPath: string | null = null;
    try {
      photoPath = await withTenant(tenantOf(owner), async (tx) => {
        const existing = await tx.product.findFirst({ where: { id: productId, brandId: owner.brandId } });
        if (!existing) throw new AppError("PRODUCT_NOT_FOUND");
        await tx.product.delete({ where: { id: productId } });
        return existing.photoPath;
      });
    } catch (error) {
      if (isStillReferenced(error)) {
        throw new AppError("IN_USE", "This product has certificates or batches. Delete those first.");
      }
      throw error;
    }
    await cleanUpMedia([photoPath], ctx, "deleteProduct");
    revalidatePath("/products");
    redirect("/products");
  },
});
