// Producer home: four headline numbers, daily scans, recent batches, scans
// per batch, certificates to renew, and the New batch button.
import type { Metadata } from "next";
import { CertificatesCard, RecentBatchesCard, ScanChartCard, StatCards, TopBatchesCard, getDashboard } from "@/features/dashboard";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const data = await getDashboard(owner, new Date());

  return (
    <PageShell
      eyebrow={template.name}
      title={`${data.greeting}, ${owner.brandName}`}
      actions={<ButtonLink href="/batches/new">New {template.labels.batch.toLowerCase()}</ButtonLink>}
    >
      <StatCards data={data} batchesLabel={template.labels.batches} />
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ScanChartCard scans={data.scans} />
        </div>
        <div className="lg:col-span-2">
          <RecentBatchesCard batches={data.recentBatches} timeZone={owner.timezone} batchesLabel={template.labels.batches} />
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <TopBatchesCard batches={data.topBatches} />
        <CertificatesCard certificates={data.certificates} />
      </div>
    </PageShell>
  );
}
