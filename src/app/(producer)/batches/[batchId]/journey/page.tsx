// Edit a batch's journey stops.
import type { Metadata } from "next";
import Link from "next/link";
import { JourneyForm, loadBatchPage } from "@/features/batches";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Journey" };

export default async function BatchJourneyPage({ params }: PageProps<"/batches/[batchId]/journey">) {
  const { batchId } = await params;
  const { template, batch, name } = await loadBatchPage(batchId);

  return (
    <PageShell
      title="Journey"
      eyebrow={name}
      width="narrow"
      description={
        <>
          Where this {template.labels.batch.toLowerCase()} went after it was made, in order. The supplier lots come
          before these on the map. <Link href={`/batches/${batch.id}`}>Back to the {template.labels.batch.toLowerCase()}</Link>
        </>
      }
    >
      <JourneyForm
        batchId={batch.id}
        stops={batch.stops}
        stopTypes={template.defaultStopTypes.map((stopType) => ({ value: stopType.id, label: stopType.label }))}
      />
    </PageShell>
  );
}
