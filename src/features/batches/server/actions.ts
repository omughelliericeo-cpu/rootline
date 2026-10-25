"use server";
// Creating, editing and deleting batches (step 1 of "New batch").
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTemplate } from "@/features/industries";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { isUniqueViolation, newPublicCode } from "@/lib/codes";
import { dateFromKey } from "@/lib/dates";
import { withTenant, type Tx } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
import { batchIdSchema, createBatchSchema, updateBatchSchema } from "../schema";
import { canDelete, defaultLotsFor, defaultStopsFor } from "../service";
import { batchDetailsToRow } from "./details";
import { toStopDraft } from "./queries";

async function assertNumberFree(tx: Tx, productId: string, number: number, exceptBatchId?: string) {
  const taken = await tx.batch.count({ where: { productId, number, ...(exceptBatchId ? { NOT: { id: exceptBatchId } } : {}) } });
  if (taken > 0) throw new ValidationError({ number: [`Number ${number} is already used for this product`] });
}

/** Lots and stops for a new batch, copied from the product's previous batch where there is one. */
async function startingPoint(tx: Tx, owner: Owner, productId: string) {
  const [previous, brand] = await Promise.all([
    tx.batch.findFirst({
      where: { brandId: owner.brandId, productId },
      orderBy: { number: "desc" },
      include: { lots: { orderBy: { position: "asc" } }, stops: { orderBy: { position: "asc" } } },
    }),
    tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { name: true, location: true, latitude: true, longitude: true } }),
  ]);
  const lots = defaultLotsFor(previous?.lots ?? []);
  const stops = defaultStopsFor((previous?.stops ?? []).map(toStopDraft), getTemplate(owner.industry), brand);
  return { lots, stops };
}

export const createBatch = defineOwnerAction({
  feature: "batches",
  action: "create",
  input: createBatchSchema,
  handler: async ({ productId, ...details }, { owner }) => {
    const row = batchDetailsToRow(owner, details);
    let batchId: string | undefined;
    // A new random code clashing with an existing one is very unlikely; retry a couple of times if it does.
    for (let attempt = 0; attempt < 3 && !batchId; attempt++) {
      try {
        batchId = await withTenant(tenantOf(owner), async (tx) => {
          const product = await tx.product.count({ where: { id: productId, brandId: owner.brandId } });
          if (!product) throw new AppError("PRODUCT_NOT_FOUND");
          await assertNumberFree(tx, productId, row.number);
          const { lots, stops } = await startingPoint(tx, owner, productId);
          const batch = await tx.batch.create({
            data: {
              ...row,
              brandId: owner.brandId,
              productId,
              code: newPublicCode(),
              lots: { create: lots.map((lot, position) => ({ ...lot, position })) },
              stops: {
                create: stops.map(({ arrivedOn, ...stop }, index) => ({
                  ...stop,
                  position: index + 1,
                  arrivedOn: arrivedOn ? dateFromKey(arrivedOn) : null,
                })),
              },
            },
          });
          return batch.id;
        });
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === 2) throw error;
      }
    }
    revalidatePath("/batches");
    redirect(`/batches/${batchId}/lots`);
  },
});

export const updateBatchDetails = defineOwnerAction({
  feature: "batches",
  action: "updateDetails",
  input: updateBatchSchema,
  handler: async ({ batchId, ...details }, { owner }) => {
    const row = batchDetailsToRow(owner, details);
    await withTenant(tenantOf(owner), async (tx) => {
      const batch = await tx.batch.findFirst({ where: { id: batchId, brandId: owner.brandId }, select: { productId: true } });
      if (!batch) throw new AppError("BATCH_NOT_FOUND");
      await assertNumberFree(tx, batch.productId, row.number, batchId);
      await tx.batch.update({ where: { id: batchId }, data: row });
    });
    revalidatePath(`/batches/${batchId}`);
    redirect(`/batches/${batchId}`);
  },
});

export const deleteBatch = defineOwnerAction({
  feature: "batches",
  action: "delete",
  input: batchIdSchema,
  handler: async ({ batchId }, { owner }) => {
    await withTenant(tenantOf(owner), async (tx) => {
      const batch = await tx.batch.findFirst({ where: { id: batchId, brandId: owner.brandId }, select: { status: true } });
      if (!batch) throw new AppError("BATCH_NOT_FOUND");
      if (!canDelete(batch.status)) throw new AppError("BATCH_PUBLISHED");
      await tx.batch.delete({ where: { id: batchId } });
    });
    revalidatePath("/batches");
    redirect("/batches");
  },
});
