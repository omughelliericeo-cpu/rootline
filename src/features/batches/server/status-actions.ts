"use server";
// Publishing a batch, marking it sold out, and taking it back offline.
import { revalidatePath } from "next/cache";
import { getTemplate } from "@/features/industries";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { changeStatusSchema } from "../schema";
import { canChangeStatus, publishProblems } from "../service";
import { toStopDraft } from "./queries";

const MESSAGES = {
  LIVE: "Published. Shoppers who scan the code now see this batch.",
  SOLD_OUT: "Marked as sold out. The story page stays up for anyone holding the product.",
  DRAFT: "Taken offline. Scanning the code now shows “not found”.",
} as const;

export const changeBatchStatus = defineOwnerAction({
  feature: "batches",
  action: "changeStatus",
  input: changeStatusSchema,
  handler: async ({ batchId, status }, { owner }) => {
    await withTenant(tenantOf(owner), async (tx) => {
      const batch = await tx.batch.findFirst({
        where: { id: batchId, brandId: owner.brandId },
        include: { lots: true, stops: { orderBy: { position: "asc" } } },
      });
      if (!batch) throw new AppError("BATCH_NOT_FOUND");
      if (!canChangeStatus(batch.status, status)) throw new AppError("BATCH_STATUS_INVALID");

      if (status === "LIVE") {
        const problems = publishProblems({
          lots: batch.lots,
          stops: batch.stops.map(toStopDraft),
          packagedAt: batch.packagedAt,
          template: getTemplate(owner.industry),
        });
        if (problems.length > 0) throw new AppError("BATCH_NOT_READY", problems.join(" "));
      }

      await tx.batch.update({
        where: { id: batchId },
        data: { status, ...(status === "LIVE" && !batch.publishedAt ? { publishedAt: new Date() } : {}) },
      });
    });
    revalidatePath("/batches", "layout");
    return { message: MESSAGES[status] };
  },
});
