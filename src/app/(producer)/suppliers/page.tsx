// Suppliers list.
import type { Metadata } from "next";
import { getTemplate } from "@/features/industries";
import { SupplierList, listSuppliers } from "@/features/suppliers";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const owner = await requireOwner();
  const suppliers = await listSuppliers(owner);

  return (
    <PageShell
      title="Suppliers"
      description="The farms and businesses you buy from. Each journey starts at a named supplier and lot."
      actions={suppliers.length > 0 && <ButtonLink href="/suppliers/new">Add a supplier</ButtonLink>}
    >
      <SupplierList suppliers={suppliers} template={getTemplate(owner.industry)} />
    </PageShell>
  );
}
