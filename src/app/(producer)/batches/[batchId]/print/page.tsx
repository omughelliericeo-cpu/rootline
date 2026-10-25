// New batch, step 3 of 3: print the QR code and publish.
import type { Metadata } from "next";
import Link from "next/link";
import { BatchStatusPanel, loadBatchPage, newBatchSteps } from "@/features/batches";
import { QrCard, batchUrl } from "@/features/qr";
import { serverConfig } from "@/lib/config";
import { Card, PageShell, Stepper } from "@/ui";

export const metadata: Metadata = { title: "Print" };

export default async function BatchPrintPage({ params }: PageProps<"/batches/[batchId]/print">) {
  const { batchId } = await params;
  const { template, batch, name, problems } = await loadBatchPage(batchId);

  return (
    <PageShell title="Print and publish" eyebrow={name} width="narrow" description={<Link href={`/batches/${batch.id}`}>Back to the {template.labels.batch.toLowerCase()}</Link>}>
      <div className="flex flex-col gap-6">
        {batch.status === "DRAFT" && <Stepper steps={newBatchSteps(template)} current={2} />}
        <Card>
          <h2 className="mb-4 text-xl">QR code</h2>
          <QrCard url={batchUrl(serverConfig().APP_URL, batch.code)} label={`QR code for ${name}`} downloadPath={`/batches/${batch.id}/qr`} />
        </Card>
        <BatchStatusPanel batchId={batch.id} status={batch.status} problems={problems} />
        {problems.length > 0 && (
          <p className="text-sm text-muted">
            Journey stops are filled in from your last {template.labels.batch.toLowerCase()}.{" "}
            <Link href={`/batches/${batch.id}/journey`}>Edit the journey</Link>
          </p>
        )}
      </div>
    </PageShell>
  );
}
