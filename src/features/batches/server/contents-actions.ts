"use server";
// Saving a batch's supplier lots (step 2 of "New batch") and journey stops.
// Each save replaces the whole list, in the order shown on the form.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTemplate } from "@/features/industries";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { dateFromKey } from "@/lib/dates";
import { withTenant, type Tx } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
import { lotRows, stopRows } from "../rows";
import { saveLotsSchema, saveStopsSchema } from "../schema";

async function assertBatchOwned(tx: Tx, owner: Owner, batchId: string) {
  const found = await tx.batch.count({ where: { id: batchId, brandId: owner.brandId } });
  if (!found) throw new AppError("BATCH_NOT_FOUND");
}

export const saveLots = defineOwnerAction({
  feature: "batches",
  action: "saveLots",
  input: saveLotsSchema,
  handler: async ({ batchId, then, ...columns }, { owner }) => {
    await withTenant(tenantOf(owner), async (tx) => {
      await assertBatchOwned(tx, owner, batchId);
      // Foreign keys skip row-level security, so only this brand's suppliers are accepted.
      const suppliers = await tx.supplier.findMany({ where: { brandId: owner.brandId }, select: { id: true } });
      const { lots, errors } = lotRows(columns, new Set(suppliers.map((supplier) => supplier.id)));
      if (Object.keys(errors).length > 0) throw new ValidationError(errors);
      await tx.batchLot.deleteMany({ where: { batchId } });
      await tx.batchLot.createMany({ data: lots.map((lot, position) => ({ ...lot, batchId, position })) });
    });
    revalidatePath(`/batches/${batchId}`, "layout");
    if (then === "print") redirect(`/batches/${batchId}/print`);
    return { message: "Lots saved." };
  },
});

export const saveStops = defineOwnerAction({
  feature: "batches",
  action: "saveStops",
  input: saveStopsSchema,
  handler: async ({ batchId, ...columns }, { owner }) => {
    const knownTypes = new Set(getTemplate(owner.industry).defaultStopTypes.map((stopType) => stopType.id));
    const { stops, errors } = stopRows(columns, knownTypes);
    if (Object.keys(errors).length > 0) throw new ValidationError(errors);

    await withTenant(tenantOf(owner), async (tx) => {
      await assertBatchOwned(tx, owner, batchId);
      await tx.routeStop.deleteMany({ where: { batchId } });
      await tx.routeStop.createMany({
        data: stops.map(({ arrivedOn, ...stop }, index) => ({
          ...stop,
          batchId,
          position: index + 1,
          arrivedOn: arrivedOn ? dateFromKey(arrivedOn) : null,
        })),
      });
    });
    revalidatePath(`/batches/${batchId}`, "layout");
    return { message: "Journey saved." };
  },
});
