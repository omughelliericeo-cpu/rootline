// Shown where a feature isn't part of the brewery's plan, or a limit is
// reached: what the upgrade unlocks and a link to Plan & billing.
import Link from "next/link";
import { buttonClasses, cx } from "@/ui";
import { PLANS, UPGRADE_PLAN } from "../plans";

type UpgradeNoticeProps = { title: string; children: React.ReactNode; className?: string };

export function UpgradeNotice({ title, children, className }: UpgradeNoticeProps) {
  return (
    <aside className={cx("flex flex-col gap-3 rounded-xl border border-sage bg-sage-soft p-5 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-forest">{PLANS[UPGRADE_PLAN].name} plan</p>
        <h2 className="mt-1 text-lg">{title}</h2>
        <div className="mt-1 max-w-prose text-sm text-ink">{children}</div>
      </div>
      <Link href="/billing" className={cx(buttonClasses("primary"), "shrink-0")}>
        See plans
      </Link>
    </aside>
  );
}
