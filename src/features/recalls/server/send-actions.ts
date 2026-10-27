"use server";
// The producer sends a recall: it is saved (and shown at the top of the
// batch's story page), then emailed to every current subscriber, one email each.
import { revalidatePath } from "next/cache";
import { batchName } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { ownerCan } from "@/features/billing";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf } from "@/lib/auth";
import { serverConfig } from "@/lib/config";
import { withTenant } from "@/lib/db";
import { emailReady, sendEmails } from "@/lib/email";
import { AppError } from "@/lib/errors";
import { sendRecallSchema } from "../schema";
import { buildRecallEmail } from "../service";

export const sendRecall = defineOwnerAction({
  feature: "recalls",
  action: "send",
  input: sendRecallSchema,
  handler: async ({ batchId, subject, body }, ctx) => {
    const { owner } = ctx;
    // Every plan can post a recall warning on the story page (safety). Emailing
    // the people signed up for alerts is part of the plans with recall emails.
    const emailing = ownerCan(owner, "recallEmails");
    // Check first, so a recall is never recorded as sent when no email could go out.
    if (emailing && !emailReady()) throw new AppError("EMAIL_NOT_CONFIGURED");

    const { message, batch, subscribers } = await withTenant(tenantOf(owner), async (tx) => {
      const found = await tx.batch.findFirst({
        where: { id: batchId, brandId: owner.brandId },
        select: { code: true, number: true, product: { select: { name: true } } },
      });
      if (!found) throw new AppError("BATCH_NOT_FOUND");
      const active = emailing
        ? await tx.recallSubscriber.findMany({ where: { batchId, unsubscribedAt: null }, select: { email: true, unsubscribeToken: true } })
        : [];
      const saved = await tx.recallMessage.create({ data: { batchId, subject, body } });
      return { message: saved, batch: found, subscribers: active };
    });

    if (!emailing) {
      revalidatePath(`/batches/${batchId}`, "layout");
      revalidatePath(`/b/${batch.code}`);
      return { message: "Recall warning posted on the story page. Emailing shoppers who signed up is part of the Growth plan." };
    }

    const appUrl = serverConfig().APP_URL.replace(/\/+$/, "");
    const name = batchName(batch.product.name, getTemplate(owner.industry).labels.batch, batch.number);
    const emails = subscribers.map((subscriber) => ({
      to: subscriber.email,
      ...buildRecallEmail({
        brandName: owner.brandName,
        batchName: name,
        subject,
        body,
        storyUrl: `${appUrl}/b/${batch.code}`,
        unsubscribeUrl: `${appUrl}/recall/unsubscribe/${subscriber.unsubscribeToken}`,
        oneClickUnsubscribeUrl: `${appUrl}/api/recall/unsubscribe/${subscriber.unsubscribeToken}`,
      }),
    }));

    // The message id as idempotency key: a retry can never email the same people twice.
    const summary = await sendEmails(emails, { idempotencyKey: `recall-${message.id}`, requestId: ctx.requestId, feature: "recalls" });
    await withTenant(tenantOf(owner), (tx) =>
      tx.recallMessage.update({ where: { id: message.id }, data: { recipientCount: summary.sent, failedCount: summary.failed } }),
    );

    revalidatePath(`/batches/${batchId}`, "layout");
    revalidatePath(`/b/${batch.code}`);
    const failedNote = summary.failed > 0 ? ` ${summary.failed} could not be sent; check the logs with reference ${ctx.requestId}.` : "";
    return { message: `Recall sent to ${summary.sent} ${summary.sent === 1 ? "person" : "people"}. It also shows on the story page.${failedNote}` };
  },
});
