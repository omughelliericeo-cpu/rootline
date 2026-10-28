// The public pricing page's plans, laid out like the owner's template: three
// cards with large centred prices and pill buttons, the recommended plan in
// forest green in the middle, then the full comparison table (from plans.ts).
// Items not built yet carry a "Coming soon" tag.
import Link from "next/link";
import { Table, Td, Th, buttonClasses, cx } from "@/ui";
import { COMPARISON, PLANS, annualSaving, type Cell, type Interval, type PlanId } from "../plans";

type PricingTableProps = {
  interval: Interval;
  /** Where Starter and Growth buttons go: sign-up, or Plan & billing when logged in. */
  ctaHref: string;
  salesEmail: string | null;
};

const PILL = "rounded-full";

function Soon({ dark }: { dark?: boolean }) {
  return (
    <span className={cx("ml-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium", dark ? "border-card/30 text-card/80" : "border-line bg-sand text-muted")}>
      Coming soon
    </span>
  );
}

/** A plan's main features with ticks, as on its pricing card (also used on Plan & billing). */
export function PlanHighlights({ id, dark, className }: { id: PlanId; dark?: boolean; className?: string }) {
  return (
    <ul className={cx("flex flex-col gap-2 text-sm", dark ? "text-card/90" : "text-ink", className)}>
      {PLANS[id].highlights.map((item) => (
        <li key={item.text} className="flex gap-2">
          <span aria-hidden="true" className={dark ? "text-sage-soft" : "text-forest"}>
            ✓
          </span>
          <span>
            {item.text}
            {item.soon && <Soon dark={dark} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CellText({ cell }: { cell: Cell }) {
  if (typeof cell === "string") return <>{cell}</>;
  return (
    <span>
      {cell.text}
      {cell.soon && <Soon />}
    </span>
  );
}

function PlanCard({ id, interval, ctaHref, salesEmail }: { id: PlanId } & PricingTableProps) {
  const plan = PLANS[id];
  const featured = id === "GROWTH";
  return (
    <li
      className={cx(
        "flex flex-col items-center gap-5 rounded-2xl px-6 py-9 text-center",
        featured ? "bg-forest text-card shadow-xl md:-my-4 md:py-12" : "border border-line bg-card shadow-sm",
      )}
    >
      <h2 className={cx("font-sans text-lg font-medium", featured ? "text-card" : "text-ink")}>{plan.name}</h2>
      <div>
        <p className={cx("font-serif text-6xl leading-none", featured && "text-card")}>
          {plan.price ? `$${plan.price[interval].toLocaleString("en-CA")}` : "Custom"}
        </p>
        <p className={cx("mt-2 text-xs", featured ? "text-card/75" : "text-muted")}>
          {plan.price ? `per brewery, per ${interval === "year" ? "year" : "month"} (CAD)` : "annual contract"}
        </p>
        {plan.price && interval === "year" && id !== "ENTERPRISE" && (
          <p className={cx("mt-1 text-xs font-medium", featured ? "text-sage-soft" : "text-forest")}>Save ${annualSaving(id)} a year</p>
        )}
      </div>
      {plan.price ? (
        <Link
          href={ctaHref}
          className={cx(
            buttonClasses("secondary", true),
            PILL,
            featured ? "border-sage-soft bg-sage-soft text-forest hover:bg-card" : "border-forest/40 hover:border-forest",
          )}
        >
          {featured ? "Start your free 30-day trial" : `Choose ${plan.name}`}
        </Link>
      ) : (
        <p className={cx("w-full rounded-full border border-forest/40 px-4 py-2.5 text-sm")}>
          {salesEmail ? <span className="select-all font-medium">{salesEmail}</span> : "Talk to us about a contract"}
        </p>
      )}
      <ul className={cx("flex flex-col gap-2.5 text-sm", featured ? "text-card/90" : "text-ink")}>
        {plan.highlights.map((item) => (
          <li key={item.text}>
            {item.text}
            {item.soon && <Soon dark={featured} />}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function PricingTable(props: PricingTableProps) {
  const { interval } = props;
  return (
    <div className="flex flex-col gap-14">
      <div className="flex justify-center">
        <nav aria-label="Billing period" className="flex rounded-full border border-forest/20 bg-card p-1 text-sm">
          {(["month", "year"] as const).map((option) => (
            <Link
              key={option}
              href={`/pricing?billing=${option === "year" ? "annual" : "monthly"}`}
              aria-current={interval === option ? "true" : undefined}
              className={cx("rounded-full px-5 py-2 no-underline", interval === option ? "bg-forest text-card" : "text-ink")}
            >
              {option === "year" ? "Yearly (save up to $120)" : "Monthly"}
            </Link>
          ))}
        </nav>
      </div>

      <ul className="grid items-center gap-6 md:grid-cols-3 md:gap-5">
        {(["STARTER", "GROWTH", "ENTERPRISE"] as const).map((id) => (
          <PlanCard key={id} id={id} {...props} />
        ))}
      </ul>
    </div>
  );
}

/** The full feature comparison, row by row. */
export function ComparisonTable() {
  return (
    <section aria-labelledby="compare-heading" className="flex flex-col gap-4">
      <h2 id="compare-heading" className="text-3xl">
        Compare plans
      </h2>
      <Table caption="Compare plans">
        <thead>
          <tr>
            <Th className="w-1/4">Feature</Th>
            <Th>Starter</Th>
            <Th>Growth</Th>
            <Th>Enterprise</Th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.label}>
              <Td className="font-medium">{row.label}</Td>
              {row.cells.map((cell, index) => (
                <Td key={index} className="text-muted">
                  <CellText cell={cell} />
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  );
}
