// Products list. The heading uses the industry's word, e.g. "Beers" or "Bakes".
import type { Metadata } from "next";
import { getTemplate } from "@/features/industries";
import { ProductList, listProducts } from "@/features/products";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const products = await listProducts(owner);

  return (
    <PageShell
      title={template.labels.products}
      description="Each one holds its ingredients, allergens and details, so new batches are quick to create."
      actions={products.length > 0 && <ButtonLink href="/products/new">Add a {template.labels.product.toLowerCase()}</ButtonLink>}
    >
      <ProductList products={products} template={template} />
    </PageShell>
  );
}
