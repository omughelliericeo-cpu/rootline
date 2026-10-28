// Layout for every producer page: sidebar navigation (top bar on phones) and
// the page. Requires a logged-in owner; each page also checks again (layouts
// are not re-run on every navigation).
import type { ReactNode } from "react";
import { ProducerHeader, type NavItem } from "@/features/auth";
import { getTemplate } from "@/features/industries";
import { pendingShopperPhotoCount } from "@/features/shopper-photos";
import { requireOwner } from "@/lib/auth";

export default async function ProducerLayout({ children }: { children: ReactNode }) {
  const owner = await requireOwner();
  const labels = getTemplate(owner.industry).labels;
  const waitingPhotos = await pendingShopperPhotoCount(owner);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/batches", label: labels.batches, icon: "box" },
    { href: "/products", label: labels.products, icon: "tag" },
    { href: "/suppliers", label: "Suppliers", icon: "truck" },
    { href: "/certificates", label: "Certificates", icon: "award" },
    { href: "/shelf-codes", label: "Shelf codes", icon: "qr" },
    { href: "/shopper-photos", label: waitingPhotos > 0 ? `Shopper photos (${waitingPhotos})` : "Shopper photos", icon: "camera" },
    { href: "/brand", label: "Brand profile", icon: "store" },
    { href: "/billing", label: "Plan & billing", icon: "document" },
    { href: "/account", label: "Account", icon: "user" },
  ];

  return (
    <div className="min-h-svh bg-cream lg:flex">
      <ProducerHeader brandName={owner.brandName} items={navItems} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
