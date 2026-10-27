// Rootline's pricing tiers: prices, limits, features and the comparison rows
// shown on /pricing. The single source of truth: features ask can() and
// limit() in service.ts instead of checking plan names themselves.
// Prices are in Canadian dollars. Stripe prices are found by lookup key
// (created by `npm run stripe:setup`), so no price ids live in code.

export type PlanId = "STARTER" | "GROWTH" | "ENTERPRISE";
export type Interval = "month" | "year";

/** Features that some plans do not include. */
export type Feature = "shelfCodes" | "recallEmails" | "shopperPhotos";
/** Things a plan allows a limited number of (null means unlimited). */
export type Limit = "liveBatches" | "activeCertificates";

type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly and annual prices in dollars; null when sold by contract. */
  price: { month: number; year: number } | null;
  features: Record<Feature, boolean>;
  limits: Record<Limit, number | null>;
  /** The short list under each plan on /pricing; "soon" marks items not built yet. */
  highlights: Array<{ text: string; soon?: boolean }>;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    tagline: "Micro-brewers, farmers' market vendors and seasonal batch makers.",
    price: { month: 35, year: 400 },
    features: { shelfCodes: false, recallEmails: false, shopperPhotos: false },
    limits: { liveBatches: 3, activeCertificates: 2 },
    highlights: [
      { text: "Up to 3 live batches at a time" },
      { text: "QR codes and A4 sticker sheets" },
      { text: "Up to 2 verified certificates" },
      { text: "PDF and CSV compliance export" },
      { text: "Story page, journey map and recall warnings" },
      { text: "Self-serve setup guide" },
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    tagline: "Active craft breweries (2–20 staff), estate wineries and specialty roasters.",
    price: { month: 110, year: 1200 },
    features: { shelfCodes: true, recallEmails: true, shopperPhotos: true },
    limits: { liveBatches: null, activeCertificates: null },
    highlights: [
      { text: "Unlimited live batches" },
      { text: "Reusable shelf codes for taps and fridges" },
      { text: "Unlimited verified badges" },
      { text: "Recall email alerts to shoppers" },
      { text: "Approved shopper photos" },
      { text: "Guided onboarding and 1-on-1 training" },
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Multi-location producers, regional co-ops and high-volume craft producers.",
    price: null,
    features: { shelfCodes: true, recallEmails: true, shopperPhotos: true },
    limits: { liveBatches: null, activeCertificates: null },
    highlights: [
      { text: "Everything in Growth" },
      { text: "White-glove setup and data migration" },
      { text: "Several brands or sites", soon: true },
      { text: "Label-printer integration", soon: true },
      { text: "Custom ERP exports", soon: true },
      { text: "Advanced analytics", soon: true },
    ],
  },
};

/** The plan that unlocks a feature or lifts a limit, for upgrade messages. */
export const UPGRADE_PLAN: PlanId = "GROWTH";

/** Plans that can be bought online (Enterprise is a custom contract). */
export const SELF_SERVE_PLANS = ["STARTER", "GROWTH"] as const satisfies readonly PlanId[];
export type SelfServePlan = (typeof SELF_SERVE_PLANS)[number];

/** e.g. "rootline_growth_annual": the Stripe price lookup key. */
export function priceLookupKey(plan: SelfServePlan, interval: Interval): string {
  return `rootline_${plan.toLowerCase()}_${interval === "month" ? "monthly" : "annual"}`;
}

/** Dollars saved per year by paying annually. */
export function annualSaving(plan: SelfServePlan): number {
  const price = PLANS[plan].price!;
  return price.month * 12 - price.year;
}

export const TRIAL_DAYS = 30;
/** Days a failed payment keeps paid features before falling back to Starter. */
export const PAST_DUE_GRACE_DAYS = 7;

/** Rows of the comparison table on /pricing. "soon" marks items not built yet. */
export type Cell = { text: string; soon?: boolean } | string;
export const COMPARISON: Array<{ label: string; cells: [Cell, Cell, Cell] }> = [
  { label: "Live batches", cells: ["Up to 3 at a time", "Unlimited", "Unlimited"] },
  {
    label: "QR codes and sticker sheets",
    cells: ["PNG, SVG and A4 sticker sheets", "Everything in Starter, plus reusable shelf codes", { text: "Everything in Growth, plus label-printer integration", soon: true }],
  },
  { label: "Verified badges and certificates", cells: ["Up to 2 active certificates", "Unlimited", "Unlimited"] },
  {
    label: "Compliance export",
    cells: ["PDF and CSV for any batch", "1-click audit-ready PDF and CSV for inspectors and retailers", { text: "Custom ERP and multi-location exports", soon: true }],
  },
  {
    label: "Shopper engagement and recalls",
    cells: [
      "Story page, journey map and recall warnings",
      "Everything in Starter, plus recall email alerts and approved shopper photos",
      { text: "Everything in Growth, plus advanced analytics and custom calls to action", soon: true },
    ],
  },
  {
    label: "Onboarding and training",
    cells: ["Self-serve guide and 20-minute setup", "Guided video onboarding and a 1-on-1 team training session", "White-glove setup, custom training and supplier and product data migration"],
  },
];
