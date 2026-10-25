// Edit or delete one supplier.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/features/industries";
import { DeleteSupplier, SupplierForm, getSupplier } from "@/features/suppliers";
import { requireOwner } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Edit supplier" };

export default async function EditSupplierPage({ params }: PageProps<"/suppliers/[supplierId]">) {
  const { supplierId } = await params;
  const owner = await requireOwner();
  const supplier = await getSupplier(owner, supplierId);
  if (!supplier) notFound();

  const sourceTypes = getTemplate(owner.industry).sourceTypes.map((type) => ({ value: type.id, label: type.label }));

  return (
    <PageShell title={supplier.name} width="narrow" description={<Link href="/suppliers">Back to suppliers</Link>}>
      <div className="flex flex-col gap-8">
        <SupplierForm supplier={supplier} sourceTypes={sourceTypes} />
        <DeleteSupplier supplierId={supplier.id} name={supplier.name} />
      </div>
    </PageShell>
  );
}
