// Plan checks for server actions and pages: the plan in force for a logged-in
// owner, and errors that say which plan unlocks what was refused.
import type { Owner } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { Feature, Limit, PlanId } from "./plans";
import { atLimit, can, effectivePlan, featureMessage, limitMessage } from "./service";

export function ownerPlan(owner: Owner, now = new Date()): PlanId {
  return effectivePlan(owner.billing, now);
}

export function ownerCan(owner: Owner, feature: Feature): boolean {
  return can(ownerPlan(owner), feature);
}

/** Throws PLAN_FEATURE when the owner's plan does not include `feature`. */
export function requireFeature(owner: Owner, feature: Feature): void {
  if (!ownerCan(owner, feature)) throw new AppError("PLAN_FEATURE", featureMessage(feature));
}

/** Throws PLAN_LIMIT when adding one more would go over the plan's limit. */
export function requireUnderLimit(owner: Owner, limit: Limit, current: number): void {
  const plan = ownerPlan(owner);
  if (atLimit(plan, limit, current)) throw new AppError("PLAN_LIMIT", limitMessage(plan, limit));
}
