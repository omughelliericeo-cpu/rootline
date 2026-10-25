// New batch, step 2 of 3 (or editing later): the supplier lots used.
import type { Metadata } from "next";
import Link from "next/link";
import { LotsForm, loadBatchPage, newBatchSteps } from "@/features/batches";
import { listSuppliers } from "@/features/suppliers";
import { PageShell, Stepper } from "@/ui";

export const metadata: Metadata = { title: "Lots" };

export default async function BatchLotsPage({ params }: PageProps<"/batches/[batchId]/lots">) {
  const { batchId } = await params;
  const { owner, template, batch, name } = await loadBatchPage(batchId);
  const suppliers = await listSuppliers(owner);
  const inFlow = batch.status === "DRAFT";

  return (
    <PageShell
      title="Supplier lots"
      eyebrow={name}
      width="narrow"
      description={
        <>
          The lots that went into this {template.labels.batch.toLowerCase()}. Pre-filled from the previous one; change
          anything that differs. <Link href={`/batches/${batch.id}`}>Back to the {template.labels.batch.toLowerCase()}</Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {inFlow && <Stepper steps={newBatchSteps(template)} current={1} />}
        <LotsForm
          batchId={batch.id}
          lots={batch.lots}
          suppliers={suppliers.map((supplier) => ({ value: supplier.id, label: `${supplier.name} (${supplier.supplies})` }))}
          inFlow={inFlow}
        />
      </div>
    </PageShell>
  );
}
