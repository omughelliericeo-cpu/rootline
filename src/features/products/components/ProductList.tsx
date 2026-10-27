// The products table: photo and name (links to the edit page), format and allergens.
import Link from "next/link";
import type { IndustryTemplate } from "@/features/industries";
import { ButtonLink, Card, Photo, Table, Td, Th } from "@/ui";
import type { ProductView } from "../server/queries";

export function ProductList({ products, template, query }: { products: ProductView[]; template: IndustryTemplate; query?: string }) {
  const plural = template.labels.products.toLowerCase();

  if (products.length === 0 && query) return <p className="text-muted">No {plural} match “{query}”.</p>;

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
    <Table caption={template.labels.products}>
      <thead>
        <tr>
          <Th>{template.labels.product}</Th>
          <Th>Format</Th>
          <Th>Allergens</Th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id} className="hover:bg-cream">
            <Td>
              <Link href={`/products/${product.id}`} className="flex items-center gap-3 font-medium text-ink">
                <span className="w-10 shrink-0">
                  {product.photoUrl ? <Photo src={product.photoUrl} alt="" aspect="square" sizes="40px" /> : <span className="block aspect-square rounded bg-sand" />}
                </span>
                {product.name}
              </Link>
            </Td>
            <Td className="text-muted">{product.format}</Td>
            <Td className="text-muted">{product.allergens.length > 0 ? product.allergens.join(", ") : "None listed"}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
