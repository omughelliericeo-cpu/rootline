// Ending a brand's Stripe subscription straight away, when its account is deleted,
// so a deleted account is never charged again. The Stripe customer and its invoices
// stay in Stripe (they are the payment records needed for tax).
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { stripe } from "./stripe";

/** Statuses Stripe can still charge or retry. "canceled" and "incomplete_expired" are already over. */
const CHARGEABLE = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

/** Returns true when a subscription was cancelled. Throws if one is running and Stripe can't be reached. */
export async function cancelSubscriptionNow(owner: Owner): Promise<boolean> {
  const brand = await withTenant(tenantOf(owner), (tx) =>
    tx.brand.findUnique({ where: { id: owner.brandId }, select: { stripeSubscriptionId: true, subscriptionStatus: true } }),
  );
  const subscriptionId = brand?.stripeSubscriptionId;
  if (!subscriptionId || !CHARGEABLE.has(brand.subscriptionStatus ?? "")) return false;

  const client = stripe();
  if (!client) throw new AppError("BILLING_NOT_CONFIGURED");
  try {
    await client.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    // Already gone in Stripe (e.g. deleted in the dashboard): nothing left to charge.
    if ((error as { code?: string }).code === "resource_missing") return false;
    throw new AppError("BILLING_FAILED", undefined, { cause: error });
  }
}
