// Products list, with search. The heading uses the industry's word, e.g. "Beers" or "Bakes".
import type { Metadata } from "next";
import { getTemplate } from "@/features/industries";
import { ProductList, listProducts } from "@/features/products";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell, SearchBox, matchesQuery, queryParam } from "@/ui";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const query = queryParam((await searchParams).q);
  const all = await listProducts(owner);
  const products = all.filter((product) => matchesQuery(query, product.name, product.format));

  return (
    <PageShell title={template.labels.products} description="Each one holds its ingredients, allergens and details, so new batches are quick to create.">
      {all.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SearchBox label={`Search ${template.labels.products.toLowerCase()}`} query={query} action="/products" />
          <ButtonLink href="/products/new">Add a {template.labels.product.toLowerCase()}</ButtonLink>
        </div>
      )}
      <ProductList products={products} template={template} query={query} />
    </PageShell>
  );
}
