"use client";
// Navigation on every producer page. Large screens: a sidebar with the
// Rootline mark, icon links (the current page highlighted) and the brand with
// log out at the bottom. Phones: a top bar whose "Menu" opens the same links
// (a <details> element, so it works without JavaScript).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineIcon, Logo, cx, type LineIconName } from "@/ui";
import { LogOutButton } from "./LogOutButton";

export type NavItem = { href: string; label: string; icon: LineIconName };

function NavLinks({ items, current }: { items: NavItem[]; current: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = current === item.href || current.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center gap-3 rounded px-3 text-sm no-underline transition-colors",
                active ? "bg-sage-soft font-medium text-forest" : "text-ink hover:bg-card",
              )}
            >
              <LineIcon name={item.icon} className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BrandFooter({ brandName }: { brandName: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <div className="flex items-center gap-3 px-3">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest font-serif text-card">
          {brandName.trim().charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-sm font-medium">{brandName}</span>
      </div>
      <LogOutButton />
    </div>
  );
}

export function ProducerHeader({ brandName, items }: { brandName: string; items: NavItem[] }) {
  const current = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-8 overflow-y-auto border-r border-line bg-sand px-3 py-6 lg:flex">
        <Logo href="/dashboard" className="px-3" />
        <nav aria-label="Producer" className="flex-1">
          <NavLinks items={items} current={current} />
        </nav>
        <BrandFooter brandName={brandName} />
      </aside>

      <header className="border-b border-line bg-sand lg:hidden">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 [&::-webkit-details-marker]:hidden">
            <Logo href="/dashboard" />
            <span className="inline-flex min-h-11 items-center gap-2 text-sm">
              <LineIcon name="menu" className="h-5 w-5" />
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Close</span>
            </span>
          </summary>
          <nav aria-label="Producer" className="flex flex-col gap-4 px-3 pb-4">
            <NavLinks items={items} current={current} />
            <BrandFooter brandName={brandName} />
          </nav>
        </details>
      </header>
    </>
  );
}
