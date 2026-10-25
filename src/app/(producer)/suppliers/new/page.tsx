// Add a supplier.
import type { Metadata } from "next";
import Link from "next/link";
import { getTemplate } from "@/features/industries";
import { SupplierForm } from "@/features/suppliers";
import { requireOwner } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Add a supplier" };

export default async function NewSupplierPage() {
  const owner = await requireOwner();
  const sourceTypes = getTemplate(owner.industry).sourceTypes.map((type) => ({ value: type.id, label: type.label }));

  return (
    <PageShell title="Add a supplier" width="narrow" description={<Link href="/suppliers">Back to suppliers</Link>}>
      <SupplierForm sourceTypes={sourceTypes} />
    </PageShell>
  );
}
