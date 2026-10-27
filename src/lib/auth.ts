// "Who is making this request, and which brand do they own?"
// Pages call requireOwner() (redirects to /login when logged out); server
// actions use defineOwnerAction() in action.ts, which returns an error result
// instead of redirecting.
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { withTenant } from "./db";
import { AppError, isAppError } from "./errors";
import { supabaseServer } from "./supabase";

export type Owner = {
  userId: string;
  email: string;
  brandId: string;
  brandName: string;
  industry: string;
  /** The brand's time zone, for "today" and expiry checks. */
  timezone: string;
  /** Billing facts; the billing feature works out the plan in force (ownerPlan). */
  billing: OwnerBilling;
};

export type OwnerBilling = {
  plan: "STARTER" | "GROWTH" | "ENTERPRISE";
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

/** The logged-in Supabase user, checked with Supabase (not just the cookie). */
export const getSessionUser = cache(async (): Promise<{ id: string; email: string } | null> => {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
});

/** The owner and their brand, or null if logged out. Cached for one request. */
export const getOwner = cache(async (): Promise<Owner | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const brand = await withTenant({ userId: user.id }, (tx) =>
    tx.brand.findUnique({
      where: { ownerUserId: user.id },
      select: { id: true, name: true, industry: true, timezone: true, plan: true, trialEndsAt: true, subscriptionStatus: true, currentPeriodEnd: true },
    }),
  );
  if (!brand) throw new AppError("BRAND_NOT_FOUND");
  const { plan, trialEndsAt, subscriptionStatus, currentPeriodEnd } = brand;
  return {
    userId: user.id,
    email: user.email,
    brandId: brand.id,
    brandName: brand.name,
    industry: brand.industry,
    timezone: brand.timezone,
    billing: { plan, trialEndsAt, subscriptionStatus, currentPeriodEnd },
  };
});

/**
 * For pages: the owner, or a redirect to the login page. A logged-in account
 * without a brand (e.g. one whose brand is in another database) is sent to
 * /setup to create one, instead of seeing an error page.
 */
export async function requireOwner(): Promise<Owner> {
  let owner: Owner | null;
  try {
    owner = await getOwner();
  } catch (error) {
    if (isAppError(error) && error.code === "BRAND_NOT_FOUND") redirect("/setup");
    throw error;
  }
  if (!owner) redirect("/login");
  return owner;
}

/** For server actions: the owner, or an UNAUTHENTICATED error result. */
export async function requireOwnerForAction(): Promise<Owner> {
  const owner = await getOwner();
  if (!owner) throw new AppError("UNAUTHENTICATED");
  return owner;
}

/** The row-level security identity for this owner (see withTenant in db.ts). */
export function tenantOf(owner: Owner): { userId: string; brandId: string } {
  return { userId: owner.userId, brandId: owner.brandId };
}
