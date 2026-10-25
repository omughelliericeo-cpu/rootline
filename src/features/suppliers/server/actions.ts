"use server";
// Server actions to add, edit and delete suppliers.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTemplate, hasOption } from "@/features/industries";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { isStillReferenced, withTenant } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
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
  handler: async (input, { owner }) => {
    const data = toRow(owner, input);
    await withTenant(tenantOf(owner), (tx) => tx.supplier.create({ data: { ...data, brandId: owner.brandId } }));
    revalidatePath("/suppliers");
    redirect("/suppliers");
  },
});

export const updateSupplier = defineOwnerAction({
  feature: "suppliers",
  action: "update",
  input: updateSupplierSchema,
  handler: async ({ supplierId, ...input }, { owner }) => {
    const data = toRow(owner, input);
    const result = await withTenant(tenantOf(owner), (tx) =>
      tx.supplier.updateMany({ where: { id: supplierId, brandId: owner.brandId }, data }),
    );
    if (result.count === 0) throw new AppError("SUPPLIER_NOT_FOUND");
    revalidatePath("/suppliers");
    return { message: "Supplier saved." };
  },
});

export const deleteSupplier = defineOwnerAction({
  feature: "suppliers",
  action: "delete",
  input: supplierIdSchema,
  handler: async ({ supplierId }, { owner }) => {
    try {
      const result = await withTenant(tenantOf(owner), (tx) =>
        tx.supplier.deleteMany({ where: { id: supplierId, brandId: owner.brandId } }),
      );
      if (result.count === 0) throw new AppError("SUPPLIER_NOT_FOUND");
    } catch (error) {
      if (isStillReferenced(error)) {
        throw new AppError("IN_USE", "This supplier has certificates, or lots used on batches. Remove those first.");
      }
      throw error;
    }
    revalidatePath("/suppliers");
    redirect("/suppliers");
  },
});
