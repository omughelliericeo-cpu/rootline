// Applies Stripe events to brands. Rather than trusting the event body, it
// fetches the subscription's current state from Stripe, so events that arrive
// late, twice or out of order still leave the brand in the right state.
// Writes go through the narrow apply_subscription() database function (see the
// billing_plans migration); the app itself cannot change billing columns.
import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { planFromLookupKey } from "../service";

const SUBSCRIPTION_EVENTS = new Set(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]);

/** The subscription id an event is about, or null for events Rootline ignores. */
export function subscriptionIdOf(event: Stripe.Event): string | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
  }
  if (SUBSCRIPTION_EVENTS.has(event.type)) return (event.data.object as Stripe.Subscription).id;
  return null;
}

export type SubscriptionFacts = {
  brandId: string;
  plan: "STARTER" | "GROWTH";
  customerId: string;
  subscriptionId: string;
  status: string;
  interval: string | null;
  periodEnd: Date | null;
};

/** What to store for a subscription, or null when it is not a Rootline plan for a known brand. */
export function factsFrom(subscription: Stripe.Subscription): SubscriptionFacts | null {
  const brandId = subscription.metadata?.brandId;
  const item = subscription.items.data[0];
  const plan = planFromLookupKey(item?.price.lookup_key);
  if (!brandId || !item || (plan !== "STARTER" && plan !== "GROWTH")) return null;
  return {
    brandId,
    plan,
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    subscriptionId: subscription.id,
    status: subscription.status,
    interval: item.price.recurring?.interval ?? null,
    periodEnd: item.current_period_end ? new Date(item.current_period_end * 1000) : null,
  };
}

export async function handleStripeEvent(client: Stripe, event: Stripe.Event, requestId: string): Promise<void> {
  const log = { feature: "billing", action: "webhook", requestId, eventId: event.id, eventType: event.type };
  const subscriptionId = subscriptionIdOf(event);
  if (!subscriptionId) {
    logger.info("stripe event ignored", log);
    return;
  }

  const facts = factsFrom(await client.subscriptions.retrieve(subscriptionId));
  if (!facts) {
    logger.warn("stripe subscription not for a Rootline plan", { ...log, subscriptionId });
    return;
  }

  const [{ ok }] = await db().$queryRaw<Array<{ ok: boolean }>>`
    SELECT apply_subscription(${facts.brandId}::uuid, ${facts.plan}::"Plan", ${facts.customerId}, ${facts.subscriptionId},
      ${facts.status}, ${facts.interval}, ${facts.periodEnd}::timestamp) AS ok`;
  // Recorded after success, for auditing; a repeat simply re-applies the latest state.
  const [{ fresh }] = await db().$queryRaw<Array<{ fresh: boolean }>>`SELECT stripe_event_claim(${event.id}, ${event.type}) AS fresh`;
  logger.info(ok ? "subscription applied" : "subscription for unknown brand", { ...log, brandId: facts.brandId, plan: facts.plan, status: facts.status, repeat: !fresh });
}
