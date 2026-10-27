"use server";
// Public actions (no login): sign up for a batch's recall alerts, and
// unsubscribe from the link in an email.
import { BILLING_SELECT, brandCan } from "@/features/billing";
import { defineAction } from "@/lib/action";
import { isPublicCode } from "@/lib/codes";
import { withPublic } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { subscribeSchema, unsubscribeSchema } from "../schema";
import { RECALL_CONSENT_TEXT, newUnsubscribeToken, normaliseEmail } from "../service";
import { unsubscribeByToken } from "./unsubscribe";

export const subscribeToRecalls = defineAction({
  feature: "recalls",
  action: "subscribe",
  input: subscribeSchema,
  handler: async ({ batchCode, email }) => {
    if (!isPublicCode(batchCode)) throw new AppError("BATCH_NOT_FOUND");
    await withPublic(async (tx) => {
      // Row-level security only shows published batches in public mode.
      const batch = await tx.batch.findUnique({ where: { code: batchCode }, select: { id: true, brand: { select: BILLING_SELECT } } });
      if (!batch) throw new AppError("BATCH_NOT_FOUND");
      // The story page hides the form on plans without recall emails; this stops direct posts too.
      if (!brandCan(batch.brand, "recallEmails")) throw new AppError("PLAN_FEATURE", "This producer doesn't offer recall email alerts.");
      // createMany: inserts without reading the row back (the public may never read
      // subscribers). skipDuplicates: signing up twice is harmless and reveals nothing.
      await tx.recallSubscriber.createMany({
        data: [{ batchId: batch.id, email: normaliseEmail(email), consentText: RECALL_CONSENT_TEXT, unsubscribeToken: newUnsubscribeToken() }],
        skipDuplicates: true,
      });
    });
    return { message: "You're on the list. We'll only email you if this batch is recalled." };
  },
});

export const unsubscribe = defineAction({
  feature: "recalls",
  action: "unsubscribe",
  input: unsubscribeSchema,
  handler: async ({ token }) => {
    if (!(await unsubscribeByToken(token))) throw new AppError("NOT_FOUND", "That unsubscribe link is not valid.");
    return { message: "You're unsubscribed. You won't get any more emails about this batch." };
  },
});
