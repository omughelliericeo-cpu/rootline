"use server";
// Creating shelf codes, pointing them at a batch, and deleting them.
import { revalidatePath } from "next/cache";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { isUniqueViolation, newPublicCode } from "@/lib/codes";
import { withTenant, type Tx } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { createShelfCodeSchema, pointShelfCodeSchema, shelfCodeIdSchema } from "../schema";

/** Foreign keys skip row-level security, so check the batch is this brand's. */
async function assertBatchOwned(tx: Tx, owner: Owner, batchId: string | undefined) {
  if (!batchId) return;
  const found = await tx.batch.count({ where: { id: batchId, brandId: owner.brandId } });
  if (!found) throw new AppError("BATCH_NOT_FOUND");
}

export const createShelfCode = defineOwnerAction({
  feature: "qr",
  action: "createShelfCode",
  input: createShelfCodeSchema,
  handler: async ({ label, batchId }, { owner }) => {
    for (let attempt = 0; ; attempt++) {
      try {
        await withTenant(tenantOf(owner), async (tx) => {
          await assertBatchOwned(tx, owner, batchId);
          await tx.shelfCode.create({ data: { brandId: owner.brandId, label, code: newPublicCode(), batchId: batchId ?? null } });
        });
        break;
      } catch (error) {
        // A clashing random code is very unlikely; try a fresh one.
        if (!isUniqueViolation(error) || attempt === 2) throw error;
      }
    }
    revalidatePath("/shelf-codes");
    return { message: `Shelf code “${label}” created.` };
  },
});

export const pointShelfCode = defineOwnerAction({
  feature: "qr",
  action: "pointShelfCode",
  input: pointShelfCodeSchema,
  handler: async ({ shelfCodeId, batchId }, { owner }) => {
    await withTenant(tenantOf(owner), async (tx) => {
      await assertBatchOwned(tx, owner, batchId);
      const result = await tx.shelfCode.updateMany({
        where: { id: shelfCodeId, brandId: owner.brandId },
        data: { batchId: batchId ?? null },
      });
      if (result.count === 0) throw new AppError("SHELF_CODE_NOT_FOUND");
    });
    revalidatePath("/shelf-codes");
    return { message: batchId ? "Shelf code now points to that batch." : "Shelf code no longer points to a batch." };
  },
});

export const deleteShelfCode = defineOwnerAction({
  feature: "qr",
  action: "deleteShelfCode",
  input: shelfCodeIdSchema,
  handler: async ({ shelfCodeId }, { owner }) => {
    const result = await withTenant(tenantOf(owner), (tx) =>
      tx.shelfCode.deleteMany({ where: { id: shelfCodeId, brandId: owner.brandId } }),
    );
    if (result.count === 0) throw new AppError("SHELF_CODE_NOT_FOUND");
    revalidatePath("/shelf-codes");
    return { message: "Shelf code deleted." };
  },
});
