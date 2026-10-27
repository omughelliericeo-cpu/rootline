// Tests for plan rules: which plan is in force, limits, prices and how Stripe
// subscriptions map onto plans.
import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { COMPARISON, PLANS, annualSaving, priceLookupKey } from "../plans";
import { factsFrom, subscriptionIdOf } from "../server/webhook";
import { atLimit, brandCan, effectivePlan, limitMessage, planFromLookupKey, trialDaysLeft, type BrandBilling } from "../service";

const NOW = new Date("2026-11-01T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const billing = (over: Partial<BrandBilling>): BrandBilling => ({ plan: "STARTER", trialEndsAt: null, subscriptionStatus: null, currentPeriodEnd: null, ...over });

describe("effectivePlan", () => {
  it("gives Growth during a trial, and Starter once it ends without a subscription", () => {
    expect(effectivePlan(billing({ plan: "GROWTH", trialEndsAt: days(5) }), NOW)).toBe("GROWTH");
    expect(effectivePlan(billing({ plan: "GROWTH", trialEndsAt: days(-1) }), NOW)).toBe("STARTER");
  });

  it("keeps a granted plan (existing brands, Enterprise contracts) with no trial or subscription", () => {
    expect(effectivePlan(billing({ plan: "GROWTH" }), NOW)).toBe("GROWTH");
    expect(effectivePlan(billing({ plan: "ENTERPRISE" }), NOW)).toBe("ENTERPRISE");
  });

  it("follows an active subscription, and keeps the trial's Growth while it lasts", () => {
    expect(effectivePlan(billing({ plan: "GROWTH", subscriptionStatus: "active" }), NOW)).toBe("GROWTH");
    expect(effectivePlan(billing({ plan: "STARTER", subscriptionStatus: "active", trialEndsAt: days(3) }), NOW)).toBe("GROWTH");
    expect(effectivePlan(billing({ plan: "STARTER", subscriptionStatus: "active", trialEndsAt: days(-3) }), NOW)).toBe("STARTER");
  });

  it("allows a short grace period while a payment is past due", () => {
    expect(effectivePlan(billing({ plan: "GROWTH", subscriptionStatus: "past_due", currentPeriodEnd: days(-3) }), NOW)).toBe("GROWTH");
    expect(effectivePlan(billing({ plan: "GROWTH", subscriptionStatus: "past_due", currentPeriodEnd: days(-8) }), NOW)).toBe("STARTER");
  });

  it("keeps paid features until the end of a cancelled period", () => {
    expect(effectivePlan(billing({ plan: "GROWTH", subscriptionStatus: "canceled", currentPeriodEnd: days(10) }), NOW)).toBe("GROWTH");
    expect(effectivePlan(billing({ plan: "GROWTH", subscriptionStatus: "canceled", currentPeriodEnd: days(-1) }), NOW)).toBe("STARTER");
    expect(effectivePlan(billing({ plan: "GROWTH", subscriptionStatus: "unpaid" }), NOW)).toBe("STARTER");
  });
});

describe("limits and features", () => {
  it("limits Starter to 3 live batches and 2 certificates, and Growth to none", () => {
    expect(atLimit("STARTER", "liveBatches", 2)).toBe(false);
    expect(atLimit("STARTER", "liveBatches", 3)).toBe(true);
    expect(atLimit("STARTER", "activeCertificates", 2)).toBe(true);
    expect(atLimit("GROWTH", "liveBatches", 500)).toBe(false);
    expect(limitMessage("STARTER", "liveBatches")).toContain("allows 3 live batches");
  });

  it("includes shelf codes, recall emails and shopper photos only from Growth", () => {
    expect(brandCan(billing({}), "shelfCodes", NOW)).toBe(false);
    expect(brandCan(billing({ plan: "GROWTH" }), "recallEmails", NOW)).toBe(true);
    expect(brandCan(billing({ plan: "GROWTH", trialEndsAt: days(-1) }), "shopperPhotos", NOW)).toBe(false);
  });

  it("counts trial days left in whole days", () => {
    expect(trialDaysLeft(days(29.5), NOW)).toBe(30);
    expect(trialDaysLeft(days(-1), NOW)).toBe(0);
    expect(trialDaysLeft(null, NOW)).toBe(0);
  });
});

describe("prices", () => {
  it("matches the owner's pricing matrix", () => {
    expect(PLANS.STARTER.price).toEqual({ month: 35, year: 400 });
    expect(PLANS.GROWTH.price).toEqual({ month: 110, year: 1200 });
    expect(PLANS.ENTERPRISE.price).toBeNull();
    expect(annualSaving("STARTER")).toBe(20);
    expect(annualSaving("GROWTH")).toBe(120);
  });

  it("names Stripe prices by lookup key and reads them back", () => {
    expect(priceLookupKey("GROWTH", "year")).toBe("rootline_growth_annual");
    expect(planFromLookupKey("rootline_starter_monthly")).toBe("STARTER");
    expect(planFromLookupKey("someone_else_price")).toBeNull();
  });

  it("never claims USDA or EU certification", () => {
    expect(JSON.stringify(COMPARISON)).not.toMatch(/USDA|EU standard/);
  });
});

describe("Stripe webhook mapping", () => {
  const subscription = {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    metadata: { brandId: "00000000-0000-4000-8000-000000000001" },
    items: { data: [{ price: { lookup_key: "rootline_growth_monthly", recurring: { interval: "month" } }, current_period_end: 1_800_000_000 }] },
  } as unknown as Stripe.Subscription;

  it("turns a subscription into the facts stored on the brand", () => {
    expect(factsFrom(subscription)).toEqual({
      brandId: "00000000-0000-4000-8000-000000000001",
      plan: "GROWTH",
      customerId: "cus_1",
      subscriptionId: "sub_1",
      status: "active",
      interval: "month",
      periodEnd: new Date(1_800_000_000 * 1000),
    });
  });

  it("ignores subscriptions that are not Rootline plans or have no brand", () => {
    expect(factsFrom({ ...subscription, metadata: {} } as unknown as Stripe.Subscription)).toBeNull();
  });

  it("finds the subscription an event is about", () => {
    expect(subscriptionIdOf({ type: "checkout.session.completed", data: { object: { subscription: "sub_9" } } } as unknown as Stripe.Event)).toBe("sub_9");
    expect(subscriptionIdOf({ type: "customer.subscription.deleted", data: { object: { id: "sub_2" } } } as unknown as Stripe.Event)).toBe("sub_2");
    expect(subscriptionIdOf({ type: "invoice.paid", data: { object: {} } } as unknown as Stripe.Event)).toBeNull();
  });
});
