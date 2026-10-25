// One batch: status, details, lots, journey and QR code, each with an edit link.
import type { Metadata } from "next";
import Link from "next/link";
import { BatchStatusPanel, DeleteBatch, canDelete, loadBatchPage } from "@/features/batches";
import { optionLabel } from "@/features/industries";
import { QrCard, batchUrl } from "@/features/qr";
import { serverConfig } from "@/lib/config";
import { Card, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Batch" };

function Section({ title, editHref, children }: { title: string; editHref?: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl">{title}</h2>
        {editHref && (
          <Link href={editHref} className="inline-flex min-h-11 items-center text-sm">
            Edit
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

export default async function BatchPage({ params }: PageProps<"/batches/[batchId]">) {
  const { batchId } = await params;
  const { owner, template, batch, name, problems } = await loadBatchPage(batchId);
  const date = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: owner.timezone });
  const base = `/batches/${batch.id}`;

  return (
    <PageShell title={name} eyebrow={template.labels.batch} description={<Link href="/batches">All {template.labels.batches.toLowerCase()}</Link>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <BatchStatusPanel batchId={batch.id} status={batch.status} problems={problems} />
        <Section title="Details" editHref={`${base}/details`}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">{template.dates.made.label}</dt>
            <dd>{date.format(batch.madeAt)}</dd>
            {template.dates.packaged && (
              <>
                <dt className="text-muted">{template.dates.packaged.label}</dt>
                <dd>{batch.packagedAt ? date.format(batch.packagedAt) : "Not set"}</dd>
              </>
            )}
          </dl>
        </Section>
        <Section title="Supplier lots" editHref={`${base}/lots`}>
          {batch.lots.length === 0 ? (
            <p className="text-sm text-muted">No lots yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {batch.lots.map((lot, index) => (
                <li key={index}>
                  {lot.supplierName}: {lot.ingredient} <span className="text-muted">· Lot {lot.lotNumber}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Journey" editHref={`${base}/journey`}>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
            {batch.stops.map((stop, index) => (
              <li key={index}>
                {stop.name} <span className="text-muted">· {optionLabel(template.defaultStopTypes, stop.type)}</span>
              </li>
            ))}
          </ol>
        </Section>
        <div className="lg:col-span-2">
          <Section title="QR code">
            <QrCard url={batchUrl(serverConfig().APP_URL, batch.code)} label={`QR code for ${name}`} downloadPath={`${base}/qr`} />
          </Section>
        </div>
      </div>
      {canDelete(batch.status) && (
        <div className="mt-8">
          <DeleteBatch batchId={batch.id} name={name} />
        </div>
      )}
    </PageShell>
  );
}
