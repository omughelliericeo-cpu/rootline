// Public pricing page, laid out like the owner's template: a centred heading
// with one italic word, the three plans, "Why choose Rootline?" cards, the
// full comparison and common questions. ?billing=annual switches to yearly
// prices without JavaScript.
import type { Metadata } from "next";
import Link from "next/link";
import { ComparisonTable, PricingTable, TRIAL_DAYS } from "@/features/billing";
import { getSessionUser } from "@/lib/auth";
import { serverConfig } from "@/lib/config";
import { LineIcon, SiteHeader, buttonClasses, cx, type LineIconName } from "@/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Rootline plans for craft breweries, wineries, bakeries, farms and roasters. Start with a free 30-day trial.",
};

const REASONS: Array<{ icon: LineIconName; title: string; text: string }> = [
  { icon: "shield", title: "Verified claims only", text: "Badges show only while a valid certificate is on file, and shoppers can open it." },
  { icon: "box", title: "Two minutes per batch", text: "Suppliers and route copy from your last batch. Print the code and you're done." },
  { icon: "document", title: "Ready for the bad day", text: "Reach buyers of a batch in minutes, and hand inspectors a full record in one click." },
  { icon: "people", title: "Stories people share", text: "Shoppers share your farms and makers with friends: free word of mouth." },
];

const FAQ = [
  { q: "How does the free trial work?", a: `Every new account gets the Growth plan free for ${TRIAL_DAYS} days, no card needed. Choose a plan before it ends to keep its features; otherwise the account moves to Starter.` },
  { q: "What happens if I go over a limit?", a: "Nothing is deleted or taken offline. You just can't publish another batch or add another certificate until you upgrade or take one offline." },
  { q: "Can I change or cancel my plan?", a: "Yes, any time from Plan & billing. When you cancel, paid features stay until the end of the period you've paid for." },
  { q: "Can every plan post a recall?", a: "Yes. Every plan can show a recall warning on its story pages. Growth adds email alerts to the shoppers who signed up." },
  { q: "Are taxes included?", a: "Prices are in Canadian dollars. Applicable sales taxes are added at checkout." },
];

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const { billing } = await searchParams;
  const interval = billing === "annual" ? "year" : "month";
  const loggedIn = Boolean(await getSessionUser());
  const startHref = loggedIn ? "/billing" : "/signup";

  return (
    <div className="min-h-svh bg-sage-soft">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-20 pt-8 sm:px-8">
        <div className="flex flex-col gap-12">
          <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <h1 className="text-5xl leading-[1.05] sm:text-6xl">
              Prove where it <em className="font-serif font-normal italic">came from</em>
            </h1>
            <p className="max-w-lg text-muted">
              Pick the plan that fits your brewery, winery, bakery or farm. Every plan starts with {TRIAL_DAYS} days of Growth, free, with no card needed.
            </p>
          </header>
          <PricingTable interval={interval} ctaHref={startHref} salesEmail={serverConfig().SALES_EMAIL ?? null} />
        </div>

        <section aria-labelledby="why-heading" className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-xl flex-col gap-2">
              <h2 id="why-heading" className="text-4xl">
                Why choose Rootline?
              </h2>
              <p className="text-sm text-muted">Built for small producers who source with care, and want shoppers to see it on every batch.</p>
            </div>
            <Link href={startHref} className={cx(buttonClasses("primary"), "rounded-full")}>
              Start free
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason, index) => {
              const dark = index === 0;
              return (
                <li key={reason.title} className={cx("flex flex-col gap-4 rounded-2xl p-6", dark ? "bg-forest text-card" : "bg-card/70 border border-forest/10")}>
                  <span className={cx("flex h-11 w-11 items-center justify-center rounded-lg border", dark ? "border-card/25 text-card" : "border-forest/20 text-forest")}>
                    <LineIcon name={reason.icon} className="h-5 w-5" />
                  </span>
                  <h3 className={cx("font-sans text-2xl font-normal leading-tight", dark && "text-card")}>{reason.title}</h3>
                  <p className={cx("flex-1 text-sm", dark ? "text-card/80" : "text-muted")}>{reason.text}</p>
                  <Link
                    href={startHref}
                    className={cx(dark ? "inline-flex min-h-11 items-center justify-center rounded-full bg-sage-soft px-5 text-sm font-medium text-forest no-underline hover:bg-card" : buttonClasses("primary"), "self-start rounded-full")}
                  >
                    Start free
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <ComparisonTable />

        <section aria-labelledby="faq-heading" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h2 id="faq-heading" className="text-3xl">
            Questions
          </h2>
          {FAQ.map((item) => (
            <details key={item.q} className="rounded-2xl border border-forest/10 bg-card px-5 py-4">
              <summary className="min-h-8 cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </section>
      </main>
    </div>
  );
}
