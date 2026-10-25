// Layout for every producer page. Requires a logged-in owner; each page also
// checks again (layouts are not re-run on every navigation).
import type { ReactNode } from "react";
import { ProducerHeader, type NavItem } from "@/features/auth";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";

export default async function ProducerLayout({ children }: { children: ReactNode }) {
  const owner = await requireOwner();
  const labels = getTemplate(owner.industry).labels;

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/batches", label: labels.batches },
    { href: "/products", label: labels.products },
    { href: "/suppliers", label: "Suppliers" },
    { href: "/certificates", label: "Certificates" },
    { href: "/shelf-codes", label: "Shelf codes" },
    { href: "/brand", label: "Brand profile" },
  ];

  return (
    <>
      <ProducerHeader brandName={owner.brandName} items={navItems} />
      {children}
    </>
  );
}
