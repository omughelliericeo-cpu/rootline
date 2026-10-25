// Edit a batch's number, dates and industry fields.
import type { Metadata } from "next";
import Link from "next/link";
import { BatchDetailsForm, loadBatchPage } from "@/features/batches";
import { dateKeyIn, timeIn } from "@/lib/dates";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Edit details" };

export default async function BatchDetailsPage({ params }: PageProps<"/batches/[batchId]/details">) {
  const { batchId } = await params;
  const { owner, template, batch, name } = await loadBatchPage(batchId);
  const zone = owner.timezone;

  return (
    <PageShell title="Details" eyebrow={name} width="narrow" description={<Link href={`/batches/${batch.id}`}>Back to the {template.labels.batch.toLowerCase()}</Link>}>
      <BatchDetailsForm
        template={template}
        values={{
          batchId: batch.id,
          productId: batch.productId,
          number: batch.number,
          madeOn: dateKeyIn(batch.madeAt, zone),
          madeTime: timeIn(batch.madeAt, zone),
          packagedOn: batch.packagedAt ? dateKeyIn(batch.packagedAt, zone) : "",
          extra: batch.extra,
        }}
      />
    </PageShell>
  );
}
