// The suppliers list: photo, name and address, with the supplier type on the
// right. Each row links to the edit page.
import Link from "next/link";
import { optionLabel, type IndustryTemplate } from "@/features/industries";
import { ButtonLink, Card, LineIcon, Photo } from "@/ui";
import type { SupplierView } from "../server/queries";

export function SupplierList({ suppliers, template, query }: { suppliers: SupplierView[]; template: IndustryTemplate; query?: string }) {
  if (suppliers.length === 0 && query) return <p className="text-muted">No suppliers match “{query}”.</p>;
  if (suppliers.length === 0) {
    return (
      <Card>
        <h2 className="mb-2 text-xl">No suppliers yet</h2>
        <p className="mb-5 max-w-prose text-muted">
          Add each farm or supplier once. Their lots become the first stop on every journey shoppers see.
        </p>
        <ButtonLink href="/suppliers/new">Add a supplier</ButtonLink>
      </Card>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded border border-line bg-card">
      {suppliers.map((supplier) => (
        <li key={supplier.id}>
          <Link href={`/suppliers/${supplier.id}`} className="flex items-center gap-4 px-4 py-3 text-ink no-underline hover:bg-cream">
            <span className="w-12 shrink-0">
              {supplier.photoUrl ? <Photo src={supplier.photoUrl} alt="" aspect="square" sizes="48px" /> : <span className="block aspect-square rounded bg-sand" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{supplier.name}</span>
              <span className="block truncate text-sm text-muted">
                {supplier.supplies} · {supplier.address}
              </span>
            </span>
            <span className="hidden text-sm text-muted sm:block">{optionLabel(template.sourceTypes, supplier.sourceType)}</span>
            <LineIcon name="chevron" className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
