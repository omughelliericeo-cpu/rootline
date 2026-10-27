// One batch's overview: scans, recall alerts and compliance downloads on top,
// then status, details, lots, journey, daily scans and the QR code.
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { scansByDay, totalScans } from "@/features/analytics";
import { BatchStatusPanel, DeleteBatch, canDelete, loadBatchPage } from "@/features/batches";
import { optionLabel } from "@/features/industries";
import { QrCard, batchUrl } from "@/features/qr";
import { recallSummary } from "@/features/recalls";
import { serverConfig } from "@/lib/config";
import { BarStrip, Card, PageShell, buttonClasses } from "@/ui";

export const metadata: Metadata = { title: "Batch" };

function Section({ title, editHref, children }: { title: string; editHref?: string; children: ReactNode }) {
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
  const [recalls, scanDays, allScans] = await Promise.all([
    recallSummary(owner, batch.id),
    scansByDay(owner, new Date(), 14, batch.id),
    totalScans(owner, [batch.id]),
  ]);
  const dayLabel = (key: string) => new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
  const date = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: owner.timezone });
  const base = `/batches/${batch.id}`;

  return (
    <PageShell nested title="Overview">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="font-sans text-sm font-medium text-muted">Total scans</h2>
          <p className="mt-2 font-serif text-4xl">{(allScans.get(batch.id) ?? 0).toLocaleString("en-CA")}</p>
        </Card>
        <Card>
          <h2 className="font-sans text-sm font-medium text-muted">Recall alerts</h2>
          <p className="mt-2 font-serif text-4xl">{recalls.activeSubscribers}</p>
          <p className="mt-1 text-sm">
            {recalls.activeSubscribers} {recalls.activeSubscribers === 1 ? "person" : "people"} signed up for alerts
            {recalls.messages.length > 0 && <span className="text-danger"> · {recalls.messages.length} recall sent</span>}
          </p>
          <Link href={`${base}/recall`} className="inline-flex min-h-11 items-center text-sm">
            Send a recall or see past recalls
          </Link>
        </Card>
        <Card>
          <h2 className="font-sans text-sm font-medium text-muted">Compliance export</h2>
          <p className="mt-2 text-sm text-muted">Product, dates, supplier lots and every journey stop, for inspectors and retailers.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`${base}/export?format=pdf`} className={buttonClasses("secondary")}>
              Download PDF
            </a>
            <a href={`${base}/export?format=csv`} className={buttonClasses("secondary")}>
              Download CSV
            </a>
          </div>
        </Card>
      </div>
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
        <Section title="Scans per day">
          <BarStrip title="Scans per day, last 14 days" bars={scanDays.map((day) => ({ label: dayLabel(day.day), value: day.count }))} />
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
