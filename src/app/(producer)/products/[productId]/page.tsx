// Edit or delete one product.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/features/industries";
import { DeleteProduct, ProductForm, getProduct } from "@/features/products";
import { requireOwner } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/products/[productId]">) {
  const { productId } = await params;
  const owner = await requireOwner();
  const product = await getProduct(owner, productId);
  if (!product) notFound();
  const template = getTemplate(owner.industry);

  return (
    <PageShell
      title={product.name}
      width="narrow"
      description={<Link href="/products">Back to {template.labels.products.toLowerCase()}</Link>}
    >
      <div className="flex flex-col gap-8">
        <ProductForm product={product} template={template} />
        <DeleteProduct productId={product.id} name={product.name} />
      </div>
    </PageShell>
  );
}
