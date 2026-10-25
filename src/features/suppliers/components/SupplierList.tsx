// The brand's suppliers, each linking to its edit page.
import Link from "next/link";
import { optionLabel, type IndustryTemplate } from "@/features/industries";
import { ButtonLink, Card } from "@/ui";
import type { SupplierView } from "../server/queries";

export function SupplierList({ suppliers, template }: { suppliers: SupplierView[]; template: IndustryTemplate }) {
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
    <ul className="grid gap-4 sm:grid-cols-2">
      {suppliers.map((supplier) => (
        <li key={supplier.id}>
          <Link href={`/suppliers/${supplier.id}`} className="block h-full no-underline">
            <Card className="h-full transition-colors hover:border-ink/40">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-brown">
                {optionLabel(template.sourceTypes, supplier.sourceType)}
              </p>
              <h2 className="mb-1 text-xl">{supplier.name}</h2>
              <p className="text-sm text-ink">{supplier.supplies}</p>
              <p className="mt-2 text-sm text-muted">{supplier.address}</p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
