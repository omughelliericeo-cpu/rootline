// What the Plan & billing page shows: the plan in force, trial and renewal
// dates, and usage against the plan's limits.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { dateFromKey, dateKeyIn } from "@/lib/dates";
import { withTenant } from "@/lib/db";
import { ownerPlan } from "../guards";
import type { PlanId } from "../plans";
import { limitOf, trialDaysLeft } from "../service";
import { stripe } from "./stripe";

export type Usage = { current: number; max: number | null };

export type BillingView = {
  plan: PlanId;
  trialDaysLeft: number;
  subscriptionStatus: string | null;
  billingInterval: string | null;
  currentPeriodEnd: Date | null;
  hasStripeCustomer: boolean;
  paymentsReady: boolean;
  usage: { liveBatches: Usage; activeCertificates: Usage };
};

export async function getBilling(owner: Owner, now = new Date()): Promise<BillingView> {
  const plan = ownerPlan(owner, now);
  const today = dateFromKey(dateKeyIn(now, owner.timezone));
  const { brand, liveBatches, activeCertificates } = await withTenant(tenantOf(owner), async (tx) => ({
    brand: await tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { stripeCustomerId: true, billingInterval: true } }),
    liveBatches: await tx.batch.count({ where: { brandId: owner.brandId, status: "LIVE" } }),
    activeCertificates: await tx.certificate.count({ where: { brandId: owner.brandId, status: "VALID", expiresOn: { gte: today } } }),
  }));
  return {
    plan,
    trialDaysLeft: trialDaysLeft(owner.billing.trialEndsAt, now),
    subscriptionStatus: owner.billing.subscriptionStatus,
    billingInterval: brand.billingInterval,
    currentPeriodEnd: owner.billing.currentPeriodEnd,
    hasStripeCustomer: brand.stripeCustomerId !== null,
    paymentsReady: stripe() !== null,
    usage: {
      liveBatches: { current: liveBatches, max: limitOf(plan, "liveBatches") },
      activeCertificates: { current: activeCertificates, max: limitOf(plan, "activeCertificates") },
    },
  };
}
