// New batch, step 1 of 3: product and dates.
import type { Metadata } from "next";
import { BatchDetailsForm, newBatchSteps, suggestedBatchNumber } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { listProducts } from "@/features/products";
import { requireOwner } from "@/lib/auth";
import { dateKeyIn } from "@/lib/dates";
import { ButtonLink, Card, PageShell, Stepper } from "@/ui";

export const metadata: Metadata = { title: "New batch" };

export default async function NewBatchPage({ searchParams }: PageProps<"/batches/new">) {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const products = await listProducts(owner);
  const title = `New ${template.labels.batch.toLowerCase()}`;

  if (products.length === 0) {
    return (
      <PageShell title={title} width="narrow">
        <Card>
          <p className="mb-5 text-muted">
            Add a {template.labels.product.toLowerCase()} first. Each {template.labels.batch.toLowerCase()} is one run of a{" "}
            {template.labels.product.toLowerCase()}.
          </p>
          <ButtonLink href="/products/new">Add a {template.labels.product.toLowerCase()}</ButtonLink>
        </Card>
      </PageShell>
    );
  }

  const { productId } = await searchParams;
  const chosen = products.find((product) => product.id === productId) ?? products[0]!;
  const numbers = await Promise.all(products.map((product) => suggestedBatchNumber(owner, product.id)));
  const suggestedNumbers = Object.fromEntries(products.map((product, index) => [product.id, numbers[index]!]));

  return (
    <PageShell title={title} width="narrow">
      <div className="flex flex-col gap-6">
        <Stepper steps={newBatchSteps(template)} current={0} />
        <BatchDetailsForm
          template={template}
          products={products.map((product) => ({ value: product.id, label: product.name }))}
          suggestedNumbers={suggestedNumbers}
          values={{
            productId: chosen.id,
            number: suggestedNumbers[chosen.id] ?? 1,
            madeOn: dateKeyIn(new Date(), owner.timezone),
            madeTime: "",
            packagedOn: "",
            extra: {},
          }}
        />
      </div>
    </PageShell>
  );
}
