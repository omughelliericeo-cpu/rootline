// Pure plan rules: which plan is in force today, what it allows, and how a
// Stripe subscription maps onto a plan. No database or Stripe calls, so every
// rule is unit tested.
import { PAST_DUE_GRACE_DAYS, PLANS, UPGRADE_PLAN, type Feature, type Limit, type PlanId } from "./plans";

const DAY = 86_400_000;

/** The billing facts stored on a brand. */
export type BrandBilling = {
  plan: PlanId;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

/**
 * The plan in force right now:
 *  - during a trial: Growth (or better, if they already pay for more);
 *  - with a Stripe subscription: the paid plan while active or trialing, for a
 *    short grace period while past due, and until the period ends once canceled;
 *  - with no subscription: the stored plan (existing brands and Enterprise
 *    contracts are granted it directly), or Starter once a trial has ended.
 */
export function effectivePlan(billing: BrandBilling, now: Date): PlanId {
  const { plan, trialEndsAt, subscriptionStatus, currentPeriodEnd } = billing;
  const inTrial = trialEndsAt !== null && trialEndsAt > now;

  let paid: PlanId;
  if (subscriptionStatus === null) {
    // Granted plans have no trial date; a finished trial without a subscription is Starter.
    paid = trialEndsAt !== null && !inTrial ? "STARTER" : plan;
  } else if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    paid = plan;
  } else if (subscriptionStatus === "past_due") {
    const graceEnds = currentPeriodEnd ? currentPeriodEnd.getTime() + PAST_DUE_GRACE_DAYS * DAY : 0;
    paid = now.getTime() < graceEnds ? plan : "STARTER";
  } else if (subscriptionStatus === "canceled") {
    paid = currentPeriodEnd && currentPeriodEnd > now ? plan : "STARTER";
  } else {
    paid = "STARTER";
  }

  if (inTrial && rank(paid) < rank("GROWTH")) return "GROWTH";
  return paid;
}

function rank(plan: PlanId): number {
  return { STARTER: 0, GROWTH: 1, ENTERPRISE: 2 }[plan];
}

export function can(plan: PlanId, feature: Feature): boolean {
  return PLANS[plan].features[feature];
}

/** The most allowed, or null for unlimited. */
export function limitOf(plan: PlanId, limit: Limit): number | null {
  return PLANS[plan].limits[limit];
}

/** True when one more would go over the plan's limit. */
export function atLimit(plan: PlanId, limit: Limit, current: number): boolean {
  const max = limitOf(plan, limit);
  return max !== null && current >= max;
}

/** Whole days left in a trial (0 when none or over). */
export function trialDaysLeft(trialEndsAt: Date | null, now: Date): number {
  if (!trialEndsAt || trialEndsAt <= now) return 0;
  return Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY);
}

const FEATURE_NAMES: Record<Feature, string> = {
  shelfCodes: "Shelf codes",
  recallEmails: "Recall email alerts",
  shopperPhotos: "Shopper photos",
};
const LIMIT_NAMES: Record<Limit, string> = { liveBatches: "live batches", activeCertificates: "active certificates" };

export function featureMessage(feature: Feature): string {
  return `${FEATURE_NAMES[feature]} are part of the ${PLANS[UPGRADE_PLAN].name} plan. Upgrade on the Plan & billing page.`;
}

export function limitMessage(plan: PlanId, limit: Limit): string {
  return `The ${PLANS[plan].name} plan allows ${limitOf(plan, limit)} ${LIMIT_NAMES[limit]}. Upgrade to ${PLANS[UPGRADE_PLAN].name} for unlimited, or remove one first.`;
}

/** Which plan a Stripe price lookup key buys (null for keys that are not Rootline's). */
export function planFromLookupKey(key: string | null | undefined): PlanId | null {
  const match = /^rootline_(starter|growth)_(monthly|annual)$/.exec(key ?? "");
  return match ? (match[1]!.toUpperCase() as PlanId) : null;
}

/** Whether a brand's plan in force includes a feature (for public pages, with no logged-in owner). */
export function brandCan(billing: BrandBilling, feature: Feature, now = new Date()): boolean {
  return can(effectivePlan(billing, now), feature);
}

/** The columns to select from a brand to work out its plan. */
export const BILLING_SELECT = { plan: true, trialEndsAt: true, subscriptionStatus: true, currentPeriodEnd: true } as const;
