// Suppliers list, with search.
import type { Metadata } from "next";
import { getTemplate } from "@/features/industries";
import { SupplierList, listSuppliers } from "@/features/suppliers";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell, SearchBox, matchesQuery, queryParam } from "@/ui";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage({ searchParams }: PageProps<"/suppliers">) {
  const owner = await requireOwner();
  const query = queryParam((await searchParams).q);
  const all = await listSuppliers(owner);
  const suppliers = all.filter((supplier) => matchesQuery(query, supplier.name, supplier.supplies, supplier.address));

  return (
    <PageShell title="Suppliers" description="The farms and businesses you buy from. Each journey starts at a named supplier and lot.">
      {all.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SearchBox label="Search suppliers" query={query} action="/suppliers" />
          <ButtonLink href="/suppliers/new">Add a supplier</ButtonLink>
        </div>
      )}
      <SupplierList suppliers={suppliers} template={getTemplate(owner.industry)} query={query} />
    </PageShell>
  );
}
