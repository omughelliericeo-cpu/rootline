// Recall reads for the producer: how many people are signed up for a batch,
// and the recalls already sent. Email addresses are never returned.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";

export type RecallSummary = {
  activeSubscribers: number;
  messages: Array<{ id: string; subject: string; body: string; sentAt: Date; recipientCount: number; failedCount: number }>;
};

export async function recallSummary(owner: Owner, batchId: string): Promise<RecallSummary> {
  if (!isUuid(batchId)) return { activeSubscribers: 0, messages: [] };
  return withTenant(tenantOf(owner), async (tx) => ({
    activeSubscribers: await tx.recallSubscriber.count({ where: { batchId, unsubscribedAt: null } }),
    messages: await tx.recallMessage.findMany({
      where: { batchId },
      orderBy: { sentAt: "desc" },
      select: { id: true, subject: true, body: true, sentAt: true, recipientCount: true, failedCount: true },
    }),
  }));
}

export type RecallTotals = { activeSubscribers: number; newThisWeek: number; recallsSent: number };

/** Brand-wide recall numbers for the dashboard. */
export async function recallTotals(owner: Owner, weekStart: Date): Promise<RecallTotals> {
  return withTenant(tenantOf(owner), async (tx) => {
    const ofBrand = { batch: { brandId: owner.brandId } };
    const [activeSubscribers, newThisWeek, recallsSent] = await Promise.all([
      tx.recallSubscriber.count({ where: { ...ofBrand, unsubscribedAt: null } }),
      tx.recallSubscriber.count({ where: { ...ofBrand, consentAt: { gte: weekStart } } }),
      tx.recallMessage.count({ where: ofBrand }),
    ]);
    return { activeSubscribers, newThisWeek, recallsSent };
  });
}
