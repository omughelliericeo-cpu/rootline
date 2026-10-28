// The Plan & billing page: the plan in force and why, usage against limits,
// the plans to choose from (Stripe Checkout) or manage (Stripe portal), each with its
// features, and the full comparison table.
import Link from "next/link";
import { Badge, Card, cx } from "@/ui";
import { PLANS, annualSaving, type Interval } from "../plans";
import type { BillingView, Usage } from "../server/queries";
import { CheckoutButton, PortalButton } from "./BillingButtons";
import { ComparisonTable, PlanHighlights } from "./PricingTable";

const date = (value: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone }).format(value);

function statusLine(view: BillingView, timeZone: string): string {
  const name = PLANS[view.plan].name;
  if (view.trialDaysLeft > 0 && !view.subscriptionStatus) {
    return `Free ${name} trial: ${view.trialDaysLeft} ${view.trialDaysLeft === 1 ? "day" : "days"} left. Choose a plan to keep your features afterwards.`;
  }
  const end = view.currentPeriodEnd ? date(view.currentPeriodEnd, timeZone) : null;
  const billed = view.billingInterval === "year" ? "billed yearly" : "billed monthly";
  switch (view.subscriptionStatus) {
    case "active":
    case "trialing":
      return `${name}, ${billed}${end ? `. Renews on ${end}` : ""}.`;
    case "past_due":
      return `Your last payment didn't go through. Update your card to keep ${name}.`;
    case "canceled":
      return end ? `Cancelled. ${name} features stay until ${end}.` : "Cancelled.";
    case null:
      return view.plan === "STARTER" ? "Starter plan." : `${name} plan, set up by Rootline.`;
    default:
      return `${name}. Subscription status: ${view.subscriptionStatus}.`;
  }
}

function Meter({ label, usage }: { label: string; usage: Usage }) {
  const full = usage.max !== null && usage.current >= usage.max;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className={cx("tabular-nums", full ? "font-semibold text-brown" : "text-muted")}>
          {usage.current} {usage.max === null ? "· unlimited" : `of ${usage.max}`}
        </span>
      </p>
      {usage.max !== null && (
        <div className="h-2 rounded-sm bg-line" aria-hidden="true">
          <div className={cx("h-2 rounded-sm", full ? "bg-brown" : "bg-forest")} style={{ width: `${Math.min(100, (usage.current / usage.max) * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

type BillingPanelProps = { view: BillingView; interval: Interval; timeZone: string; salesEmail: string | null; notice?: string };

export function BillingPanel({ view, interval, timeZone, salesEmail, notice }: BillingPanelProps) {
  const subscribed = view.subscriptionStatus === "active" || view.subscriptionStatus === "trialing" || view.subscriptionStatus === "past_due";
  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <p role="status" className="rounded border border-sage bg-sage-soft px-4 py-3 text-sm text-forest">
          {notice}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl">{PLANS[view.plan].name}</h2>
            <Badge tone="live">Current plan</Badge>
          </div>
          <p className="text-sm">{statusLine(view, timeZone)}</p>
          {view.hasStripeCustomer && view.paymentsReady && <PortalButton />}
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg">Usage</h2>
          <Meter label="Live batches" usage={view.usage.liveBatches} />
          <Meter label="Active certificates" usage={view.usage.activeCertificates} />
        </Card>
      </div>

      <section aria-labelledby="choose-plan" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="choose-plan" className="text-2xl">
            {subscribed ? "Change plan" : "Choose a plan"}
          </h2>
          <nav aria-label="Billing period" className="flex rounded-full border border-line bg-card p-1 text-sm">
            {(["month", "year"] as const).map((option) => (
              <Link
                key={option}
                href={`/billing?billing=${option === "year" ? "annual" : "monthly"}`}
                aria-current={interval === option ? "true" : undefined}
                className={cx("rounded-full px-4 py-1.5 no-underline", interval === option ? "bg-forest text-card" : "text-ink")}
              >
                {option === "year" ? "Yearly" : "Monthly"}
              </Link>
            ))}
          </nav>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(["STARTER", "GROWTH"] as const).map((id) => {
            const plan = PLANS[id];
            const price = plan.price![interval];
            return (
              <Card key={id} className={cx("flex flex-col gap-3", id === "GROWTH" && "border-forest")}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl">{plan.name}</h3>
                  {id === "GROWTH" && <Badge tone="verified">Recommended</Badge>}
                </div>
                <p className="font-serif text-3xl">
                  ${price.toLocaleString("en-CA")}
                  <span className="font-sans text-sm text-muted"> / {interval === "year" ? "year" : "month"} CAD</span>
                </p>
                {interval === "year" && <p className="text-xs text-forest">Save ${annualSaving(id)} a year</p>}
                <p className="text-sm text-muted">{plan.tagline}</p>
                <PlanHighlights id={id} className="flex-1 border-t border-line pt-3" />
                {view.plan === id && subscribed ? (
                  <p className="text-sm font-medium text-forest">Your current plan</p>
                ) : !view.paymentsReady ? (
                  <p className="text-sm text-muted">Online payment isn&rsquo;t set up yet. Contact Rootline to change plan.</p>
                ) : subscribed ? (
                  <p className="text-sm text-muted">Switch plans with &ldquo;Manage billing&rdquo; above.</p>
                ) : (
                  <CheckoutButton plan={id} interval={interval} label={`Choose ${plan.name}`} primary={id === "GROWTH"} />
                )}
              </Card>
            );
          })}
          <Card className="flex flex-col gap-3">
            <h3 className="text-xl">{PLANS.ENTERPRISE.name}</h3>
            <p className="font-serif text-3xl">Custom</p>
            <p className="text-sm text-muted">{PLANS.ENTERPRISE.tagline}</p>
            <PlanHighlights id="ENTERPRISE" className="flex-1 border-t border-line pt-3" />
            <p className="text-sm">
              Talk to us{salesEmail ? <>: <span className="select-all font-medium">{salesEmail}</span></> : "."}
            </p>
          </Card>
        </div>
        <p className="text-sm text-muted">
          Prices in Canadian dollars; taxes may apply. Cancel any time.
        </p>
      </section>

      <ComparisonTable />
    </div>
  );
}
