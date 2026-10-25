// Top bar on every producer page: brand name, navigation and log out.
// The links scroll sideways on a narrow phone instead of wrapping.
import Link from "next/link";
import { LogOutButton } from "./LogOutButton";

export type NavItem = { href: string; label: string };

export function ProducerHeader({ brandName, items }: { brandName: string; items: NavItem[] }) {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="font-serif text-lg text-ink no-underline">
          {brandName}
        </Link>
        <LogOutButton />
      </div>
      <nav aria-label="Producer" className="mx-auto max-w-5xl overflow-x-auto px-2 sm:px-4">
        <ul className="flex gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="inline-flex min-h-11 items-center px-3 text-sm text-ink no-underline hover:text-forest">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
