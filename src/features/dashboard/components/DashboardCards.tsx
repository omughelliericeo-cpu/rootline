// The dashboard cards, laid out like the owner's style template: a row of
// four headline numbers, then the daily-scans chart, recent batches, scans
// per batch and certificates to renew.
import Link from "next/link";
import { StatusBadge } from "@/features/batches";
import { Badge, BarStrip, Card, ProgressRow } from "@/ui";
import type { DashboardData } from "../server/queries";
import { daysLeftLabel } from "../service";

const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-lg">{children}</h2>;
}

function StatCard({ title, value, note, tone = "ink" }: { title: string; value: number; note: React.ReactNode; tone?: "ink" | "brown" }) {
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="font-sans text-sm font-medium text-muted">{title}</h2>
      <p className={tone === "brown" ? "font-serif text-4xl text-brown" : "font-serif text-4xl"}>{value.toLocaleString("en-CA")}</p>
      <p className="text-sm text-muted">{note}</p>
    </Card>
  );
}

type StatsProps = { data: DashboardData; batchesLabel: string };

/** Scans this week, recall sign-ups, live batches and certificates expiring soon. */
export function StatCards({ data, batchesLabel }: StatsProps) {
  const expiring = data.certificates.filter((cert) => !cert.expired).length;
  const change = data.scans.change;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Scans this week"
        value={data.scans.thisWeek}
        note={change ? <span className={change.startsWith("-") ? "text-brown" : "text-forest"}>{change} vs last week</span> : "First week of scans"}
      />
      <StatCard
        title="Recall alert sign-ups"
        value={data.recalls.activeSubscribers}
        note={<span className="text-forest">+{data.recalls.newThisWeek} this week</span>}
      />
      <StatCard title={`Live ${batchesLabel.toLowerCase()}`} value={data.liveBatches} note="On sale now" />
      <StatCard title="Expiring certificates" value={expiring} note="Next 30 days" tone={expiring > 0 ? "brown" : "ink"} />
    </div>
  );
}

export function ScanChartCard({ scans }: { scans: DashboardData["scans"] }) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Scans per day</CardTitle>
        <p className="text-xs text-muted">Last 14 days</p>
      </div>
      <BarStrip title="Scans per day, last 14 days" bars={scans.days.map((day) => ({ label: dayLabel(day.day), value: day.count }))} />
    </Card>
  );
}

export function TopBatchesCard({ batches }: { batches: DashboardData["topBatches"] }) {
  const max = batches[0]?.count ?? 0;
  return (
    <Card>
      <CardTitle>Scans per batch, last 30 days</CardTitle>
      {batches.length === 0 ? (
        <p className="text-sm text-muted">No scans yet. They appear here once shoppers scan your codes.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => (
            <ProgressRow key={batch.batchId} label={batch.name} value={batch.count} max={max} href={`/batches/${batch.batchId}`} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function CertificatesCard({ certificates }: { certificates: DashboardData["certificates"] }) {
  return (
    <Card>
      <CardTitle>Certificates</CardTitle>
      {certificates.length === 0 ? (
        <p className="text-sm text-muted">All certificates are in date for the next 30 days.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {certificates.map((cert) => (
            <li key={cert.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">
                <span className="font-medium">{cert.claimLabel}</span> <span className="text-muted">· {cert.coversLabel}</span>
              </span>
              <Badge tone={cert.expired ? "draft" : "warning"}>{daysLeftLabel(cert.daysLeft)}</Badge>
            </li>
          ))}
        </ul>
      )}
      <Link href="/certificates" className="mt-4 inline-flex min-h-11 items-center text-sm">
        Manage certificates
      </Link>
    </Card>
  );
}

export function RecentBatchesCard({ batches, timeZone, batchesLabel }: { batches: DashboardData["recentBatches"]; timeZone: string; batchesLabel: string }) {
  const date = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone });
  return (
    <Card>
      <CardTitle>Recent {batchesLabel.toLowerCase()}</CardTitle>
      {batches.length === 0 ? (
        <p className="text-sm text-muted">Nothing yet. Start with the New button above.</p>
      ) : (
        <ul className="flex flex-col">
          {batches.map((batch) => (
            <li key={batch.id} className="border-b border-line last:border-0">
              <Link href={`/batches/${batch.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2 text-ink no-underline hover:text-forest">
                <span>
                  <span className="block text-sm font-medium">{batch.name}</span>
                  <span className="block text-xs text-muted">
                    {date.format(batch.madeAt)} · {batch.scans} {batch.scans === 1 ? "scan" : "scans"}
                  </span>
                </span>
                <StatusBadge status={batch.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
