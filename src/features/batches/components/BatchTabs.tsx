"use client";
// The tab row on every batch page: Overview, Details, Lots, Journey, Print,
// Recall. Plain links (work without JavaScript); the current one is underlined.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/ui";

export function BatchTabs({ batchId }: { batchId: string }) {
  const current = usePathname();
  const base = `/batches/${batchId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/details`, label: "Details" },
    { href: `${base}/lots`, label: "Lots" },
    { href: `${base}/journey`, label: "Journey" },
    { href: `${base}/print`, label: "Print" },
    { href: `${base}/recall`, label: "Recall" },
  ];

  return (
    <nav aria-label="Batch sections" className="-mx-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1">
        {tabs.map((tab) => {
          const active = current === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex min-h-11 items-center border-b-2 px-3 text-sm no-underline",
                  active ? "border-forest font-medium text-forest" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
