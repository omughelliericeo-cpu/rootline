// Plan & billing: the plan in force, usage against limits, and choosing or
// managing a plan through Stripe.
import type { Metadata } from "next";
import { BillingPanel, getBilling } from "@/features/billing";
import { requireOwner } from "@/lib/auth";
import { serverConfig } from "@/lib/config";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Plan & billing" };

const NOTICES: Record<string, string> = {
  success: "Thank you! Your plan updates here within a minute, as soon as Stripe confirms the payment.",
  cancelled: "Checkout was cancelled. Nothing was charged.",
};

export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  const owner = await requireOwner();
  const { billing, checkout } = await searchParams;
  const view = await getBilling(owner);

  return (
    <PageShell title="Plan & billing" description="Your plan, what you're using, and changing or cancelling your subscription.">
      <BillingPanel
        view={view}
        interval={billing === "annual" ? "year" : "month"}
        timeZone={owner.timezone}
        salesEmail={serverConfig().SALES_EMAIL ?? null}
        notice={typeof checkout === "string" ? NOTICES[checkout] : undefined}
      />
    </PageShell>
  );
}
