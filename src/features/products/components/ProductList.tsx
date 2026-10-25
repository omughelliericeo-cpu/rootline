// The brand's products, each linking to its edit page.
import Link from "next/link";
import type { IndustryTemplate } from "@/features/industries";
import { ButtonLink, Card, Photo } from "@/ui";
import type { ProductView } from "../server/queries";

export function ProductList({ products, template }: { products: ProductView[]; template: IndustryTemplate }) {
  const plural = template.labels.products.toLowerCase();

  if (products.length === 0) {
    return (
      <Card>
        <h2 className="mb-2 text-xl">No {plural} yet</h2>
        <p className="mb-5 max-w-prose text-muted">
          Add each {template.labels.product.toLowerCase()} once with its ingredients and allergens. Every new batch then
          starts from it.
        </p>
        <ButtonLink href="/products/new">Add a {template.labels.product.toLowerCase()}</ButtonLink>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {products.map((product) => (
        <li key={product.id}>
          <Link href={`/products/${product.id}`} className="block h-full no-underline">
            <Card className="flex h-full gap-4 transition-colors hover:border-ink/40">
              {product.photoUrl && (
                <div className="w-20 shrink-0">
                  <Photo src={product.photoUrl} alt="" aspect="square" sizes="80px" />
                </div>
              )}
              <div>
                <h2 className="mb-1 text-xl">{product.name}</h2>
                <p className="text-sm text-ink">{product.format}</p>
                {product.allergens.length > 0 && (
                  <p className="mt-2 text-sm text-muted">Contains: {product.allergens.join(", ")}</p>
                )}
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
