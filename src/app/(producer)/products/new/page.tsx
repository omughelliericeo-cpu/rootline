// Add a product.
import type { Metadata } from "next";
import Link from "next/link";
import { getTemplate } from "@/features/industries";
import { ProductForm } from "@/features/products";
import { requireOwner } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Add a product" };

export default async function NewProductPage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);

  return (
    <PageShell
      title={`Add a ${template.labels.product.toLowerCase()}`}
      width="narrow"
      description={<Link href="/products">Back to {template.labels.products.toLowerCase()}</Link>}
    >
      <ProductForm template={template} />
    </PageShell>
  );
}
